import { QdrantClient } from '@qdrant/js-client-rest';

export const qdrantClient = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY
});

export const checkQdrantConnection = async () => {
  try {
    const result = await qdrantClient.getCollections();
    console.log(
      `Qdrant connected. Collections: ${result.collections.length}`
    );
  } catch (err) {
    console.error('Qdrant connection failed:', err.message);
    process.exit(1);
  }
};
