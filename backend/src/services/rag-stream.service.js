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
You are an AI assistant.
Answer the question using ONLY the information provided in the CONTEXT section.
Use the CONVERSATION HISTORY only to understand follow-up questions or references.
Do NOT use external knowledge, assumptions, or prior training data.
If the answer is not present, say "I don’t see this information in the documents I have access to".

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
