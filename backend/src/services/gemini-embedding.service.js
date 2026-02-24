import { GoogleGenerativeAI } from '@google/generative-ai';
import { retryWithBackoff } from '../utils/retry.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Gemini embedding model
export const embedText = async (text) => {
  return retryWithBackoff(async () => {
    const model = genAI.getGenerativeModel({ model: 'embedding-001' });
    
    const result = await model.embedContent(text);
    
    return result.embedding.values; // array<number>
  }, 3, 2000); // 3 retries, starting with 2s delay
};
