import 'dotenv/config';
import { qdrantClient } from '../config/vector.js';

const COLLECTION_NAME = 'documents';

const run = async () => {
  try {
    const collections = await qdrantClient.getCollections();

    const exists = collections.collections.some(
      (c) => c.name === COLLECTION_NAME
    );

    if (exists) {
      console.log(`✅ Collection "${COLLECTION_NAME}" already exists`);
      process.exit(0);
    }

    await qdrantClient.createCollection(COLLECTION_NAME, {
      vectors: {
        size: 384,
        distance: 'Cosine'
      }
    });

    console.log(`🎉 Collection "${COLLECTION_NAME}" created successfully`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to create collection:', err.message);
    process.exit(1);
  }
};

run();
