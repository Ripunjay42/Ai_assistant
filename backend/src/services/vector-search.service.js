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

export const deleteVectorsByDocumentId = async (documentId) => {
  try {
    // Scroll to find all point IDs for this document, then delete by IDs
    const pointsToDelete = [];
    let offset = null;
    
    do {
      const scrollResult = await qdrantClient.scroll(COLLECTION, {
        filter: {
          must: [
            {
              key: 'documentId',
              match: { value: documentId }
            }
          ]
        },
        limit: 100,
        offset: offset,
        with_payload: false,
        with_vector: false
      });

      if (scrollResult.points && scrollResult.points.length > 0) {
        pointsToDelete.push(...scrollResult.points.map(p => p.id));
        offset = scrollResult.next_page_offset;
      } else {
        break;
      }
    } while (offset);

    // Delete by IDs if any points found
    if (pointsToDelete.length > 0) {
      await qdrantClient.delete(COLLECTION, {
        points: pointsToDelete
      });
      console.log(`Deleted ${pointsToDelete.length} vectors for document: ${documentId}`);
    } else {
      console.log(`No vectors found for document: ${documentId}`);
    }
  } catch (error) {
    console.error('Failed to delete from Qdrant:', error.message);
    // Don't throw - allow deletion to continue even if vectors not found
  }
};
