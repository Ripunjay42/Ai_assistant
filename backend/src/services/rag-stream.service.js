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

Use the CONVERSATION HISTORY only to understand follow-up questions and user intent.

IMPORTANT RULES (MUST FOLLOW):
1. Answer ONLY the user’s current QUESTION.
2. Do NOT introduce or answer unrelated topics.
3. Write the answer in clear paragraphs.
4. EACH paragraph MUST end with exactly ONE source label on a new line.
5. Allowed source labels:
   - [Source: Documents] → only if the information is explicitly present in CONTEXT
   - [Source: General Knowledge] → only if the information is NOT present in CONTEXT
6. NEVER mix document-based information and general knowledge in the same paragraph.
7. NEVER fabricate document-based answers.
8. Do NOT apologize or explain missing context unless explicitly asked.
9. If CONTEXT is empty or irrelevant, answer using GENERAL KNOWLEDGE only.

Answering logic:
- If the QUESTION can be answered using CONTEXT, answer using CONTEXT only.
- If the QUESTION cannot be answered using CONTEXT, answer using GENERAL KNOWLEDGE only.
- Do NOT combine both in a single answer unless the QUESTION explicitly requires it.

${history ? `CONVERSATION HISTORY:\n${history}\n` : ''}

CONTEXT:
${context || '[NO CONTEXT PROVIDED]'}

QUESTION:
${question}

ANSWER:
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
