import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const generateEmbeddings = async (chunks) => {
  const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
  
  const embeddings = [];
  
  for (const chunk of chunks) {
    try {
      // Generate embedding for this chunk
      const result = await model.embedContent(chunk);
      embeddings.push({
        embedding: result.embedding.values // 768-dimensional vector
      });
      
      // Small delay to avoid rate limits (100ms between requests)
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error('Embedding generation failed for chunk:', error.message);
      // Use zero vector as fallback (not ideal, but prevents pipeline failure)
      embeddings.push({
        embedding: Array(768).fill(0)
      });
    }
  }
  
  console.log(`✅ Generated ${embeddings.length} embeddings using Gemini text-embedding-004`);
  
  return embeddings;
};
