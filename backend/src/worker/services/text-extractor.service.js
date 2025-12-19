import pdf from 'pdf-parse';

export const extractText = async (buffer, key) => {
  if (key.endsWith('.pdf')) {
    const data = await pdf(buffer);
    return data.text;
  }

  return buffer.toString('utf-8');
};
