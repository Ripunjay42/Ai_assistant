import 'dotenv/config';
import { qdrantClient } from '../config/vector.js';

const COLLECTION_NAME = 'documents';
const VECTOR_SIZE = 768; // text-embedding-004 uses 768 dimensions

const run = async () => {
  try {
    const collections = await qdrantClient.getCollections();

    const exists = collections.collections.some(
      (c) => c.name === COLLECTION_NAME
    );

    if (exists) {
      console.log(`Collection "${COLLECTION_NAME}" already exists. Deleting...`);
      await qdrantClient.deleteCollection(COLLECTION_NAME);
    }

    // Create collection
    await qdrantClient.createCollection(COLLECTION_NAME, {
      vectors: {
        size: VECTOR_SIZE,
        distance: 'Cosine'
      }
    });

    // Create index for workspaceId filtering
    await qdrantClient.createPayloadIndex(COLLECTION_NAME, {
      field_name: 'workspaceId',
      field_schema: 'keyword'
    });

    console.log(`✅ Collection "${COLLECTION_NAME}" created successfully`);
    console.log(`   - Vector size: ${VECTOR_SIZE}`);
    console.log(`   - Payload index: workspaceId (keyword)`);
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to create collection:', err.message);
    process.exit(1);
  }
};

run();
