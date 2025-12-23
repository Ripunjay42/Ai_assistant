import { qdrantClient } from '../config/vector.js';

const COLLECTION = 'documents';

export const searchVectors = async (
  queryEmbedding,
  workspaceId,
  limit = 5
) => {
  const results = await qdrantClient.search(COLLECTION, {
    vector: queryEmbedding,
    limit,
    with_payload: true,
    filter: {
      must: [
        {
          key: 'workspaceId',
          match: { value: workspaceId }
        }
      ]
    }
  });

  return results.map((r) => ({
    score: r.score,
    text: r.payload.text,
    documentId: r.payload.documentId
  }));
};
