import { GoogleGenerativeAI } from '@google/generative-ai';
import { embedText } from './gemini-embedding.service.js';
import { searchVectors } from './vector-search.service.js';
import { retryWithBackoff } from '../utils/retry.js';
import {
  getCachedRagAnswer,
  setCachedRagAnswer
} from './rag-cache.service.js';
import {
  getChatMemory,
  saveMessage
} from './chat-memory.service.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const runRAG = async ({ question, workspaceId, chatId }) => {
  // Cache check
  const cached = await getCachedRagAnswer(workspaceId, question);
  if (cached) {
    console.log('RAG cache hit');
    return cached;
  }

  // Chat memory
  const memory = chatId ? await getChatMemory(chatId) : [];
  const history = memory
    .map(m => `${m.role}: ${m.content}`)
    .join('\n');

  // Embed the question
  const queryEmbedding = await embedText(question);

  // Retrieve relevant document chunks
  const chunks = await searchVectors(queryEmbedding, workspaceId);

  if (chunks.length === 0) {
    return {
      answer: "I couldn't find relevant information in your documents.",
      sources: []
    };
  }

  // Build context
  const context = chunks
    .map((c, i) => `Source ${i + 1}:\n${c.text}`)
    .join('\n\n');

  // Strong grounding prompt with conversation history
  const prompt = `
You are an AI assistant.
Answer the question ONLY using the context below.
If the answer is not present, say "I don't know".

${history ? `Conversation:\n${history}\n\n` : ''}Context:
${context}

Question:
${question}
`;

  // Ask Gemini with retry logic
  const answer = await retryWithBackoff(async () => {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }, 3, 2000); // 3 retries, starting with 2s delay

  const result = {
    answer,
    sources: chunks.map((c, i) => ({
      index: i + 1,
      documentId: c.documentId,
      score: c.score
    }))
  };

  // save memory
  if (chatId) {
    await saveMessage(chatId, 'user', question);
    await saveMessage(chatId, 'assistant', result.answer);
  }

  // Cache result
  await setCachedRagAnswer(workspaceId, question, result);

  return result;
};
