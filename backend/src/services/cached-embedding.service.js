import { redisClient } from '../config/redis.js';
import { embedText } from './gemini-embedding.service.js';
import crypto from 'crypto';

// Cache embeddings in Redis to avoid hitting API limits
export const getCachedEmbedding = async (text) => {
  // Create hash of text as cache key
  const hash = crypto.createHash('md5').update(text).digest('hex');
  const cacheKey = `embedding:${hash}`;
  
  // Try to get from cache
  const cached = await redisClient.get(cacheKey);
  if (cached) {
    console.log('✅ Embedding cache hit');
    return JSON.parse(cached);
  }
  
  // Not in cache, call API
  console.log('❌ Embedding cache miss, calling API');
  const embedding = await embedText(text);
  
  // Store in cache (expire after 7 days)
  await redisClient.setEx(cacheKey, 7 * 24 * 60 * 60, JSON.stringify(embedding));
  
  return embedding;
};
