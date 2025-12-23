import { GoogleGenerativeAI } from '@google/generative-ai';
import { embedText } from './gemini-embedding.service.js';
import { searchVectors } from './vector-search.service.js';
import { retryWithBackoff } from '../utils/retry.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const runRAG = async ({ question, workspaceId }) => {
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

  // Strong grounding prompt
  const prompt = `
You are an AI assistant.
Answer the question ONLY using the context below.
If the answer is not present, say "I don't know".

Context:
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

  return {
    answer,
    sources: chunks.map((c, i) => ({
      index: i + 1,
      documentId: c.documentId,
      score: c.score
    }))
  };
};
