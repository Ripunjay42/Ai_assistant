export const generateEmbeddings = async (chunks) => {
  return chunks.map(() => ({
    embedding: Array(384).fill(0).map(() => Math.random())
  }));
};
