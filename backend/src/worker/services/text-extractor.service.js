import { PDFExtract } from 'pdf.js-extract';

const pdfExtract = new PDFExtract();

export const extractText = async (buffer, key) => {
  if (key.toLowerCase().endsWith('.pdf')) {
    const data = await pdfExtract.extractBuffer(buffer);
    const text = data.pages
      .map(page => page.content.map(item => item.str).join(' '))
      .join('\n');
    return text || '';
  }

  return buffer.toString('utf-8');
};
