export const chunkText = (text, chunkSize = 500, overlap = 50) => {
  const chunks = [];
  let index = 0;

  while (index < text.length) {
    chunks.push(text.slice(index, index + chunkSize));
    index += chunkSize - overlap;
  }

  return chunks;
};
