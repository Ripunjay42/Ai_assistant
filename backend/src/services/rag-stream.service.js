import { GoogleGenerativeAI } from '@google/generative-ai';
import { embedText } from './gemini-embedding.service.js';
import { searchVectors } from './vector-search.service.js';
import {
  getCachedRagAnswer,
  setCachedRagAnswer
} from './rag-cache.service.js';
import {
  getChatMemory,
  saveMessage
} from './chat-memory.service.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const streamRAG = async ({
  question,
  workspaceId,
  chatId,
  res
}) => {
  // Cache check
  const cached = await getCachedRagAnswer(workspaceId, question);
  if (cached) {
    console.log('RAG cache hit (streaming)');
    res.write(`data: ${cached.answer}\n\n`);
    return;
  }

  // Chat memory
  const memory = chatId ? await getChatMemory(chatId) : [];
  const history = memory
    .map(m => `${m.role}: ${m.content}`)
    .join('\n');

  // Vector search
  const embedding = await embedText(question);
  const chunks = await searchVectors(embedding, workspaceId);

  if (!chunks.length) {
    res.write(`data: I couldn't find relevant information in your documents.\n\n`);
    return;
  }

  const context = chunks
    .map((c, i) => `Source ${i + 1}:\n${c.text}`)
    .join('\n\n');

  // Prompt
  const prompt = `
You are a helpful AI assistant.

CORE DIRECTIVES:

1. Use CONVERSATION HISTORY to understand follow-up questions and intent.

2. If relevant information is available in the CONTEXT, use only that context to provide an accurate, grounded answer.

3. If the CONTEXT is empty or does not contain the answer, use your general knowledge.

4. Do not invent facts or reference documents that are not provided.

MANDATORY OUTPUT FORMAT: You must conclude every single response with a source tag on a new line. Choose exactly one based on your logic:

. If you used the provided context: [Source: Documents]

. If you used your own training data: [Source: General Knowledge]

CRITICAL: Failure to include the source tag is a violation of these instructions. Ensure the tag is the very last thing you write.


${history ? `Conversation:\n${history}\n\n` : ''}Context:
${context}

Question:
${question}
`;

  // Gemini streaming
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const result = await model.generateContentStream(prompt);

  let fullAnswer = '';

  // Stream tokens as they arrive
  for await (const chunk of result.stream) {
    const chunkText = chunk.text();
    if (chunkText) {
      fullAnswer += chunkText;
      // Send token to client via SSE
      res.write(`data: ${chunkText}\n\n`);
    }
  }

  // Save memory (after stream completes)
  if (chatId) {
    await saveMessage(chatId, 'user', question);
    await saveMessage(chatId, 'assistant', fullAnswer);
  }

  // Cache final answer (complete response only)
  await setCachedRagAnswer(workspaceId, question, {
    answer: fullAnswer,
    sources: chunks.map((c, i) => ({
      index: i + 1,
      documentId: c.documentId,
      score: c.score
    }))
  });
};
