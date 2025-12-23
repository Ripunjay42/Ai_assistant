export const generateEmbeddings = async (chunks) => {
  // Mock embeddings with 768 dimensions (matching text-embedding-004)
  return chunks.map(() => ({
    embedding: Array(768).fill(0).map(() => Math.random() * 2 - 1)
  }));
};
