import { GoogleGenerativeAI } from '@google/generative-ai';
import { embedText } from './gemini-embedding.service.js';
import { searchVectors } from './vector-search.service.js';
import {
  getCachedRagAnswer,
  setCachedRagAnswer
} from './rag-cache.service.js';
import {
  getChatMemory,
  saveMessage
} from './chat-memory.service.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const streamRAG = async ({
  question,
  workspaceId,
  chatId,
  res
}) => {
  // 0️⃣ Cache check
  const cached = await getCachedRagAnswer(workspaceId, question);
  if (cached) {
    console.log('⚡ RAG cache hit (streaming)');
    res.write(`data: ${cached.answer}\n\n`);
    return;
  }

  // 1️⃣ Chat memory
  const memory = chatId ? await getChatMemory(chatId) : [];
  const history = memory
    .map(m => `${m.role}: ${m.content}`)
    .join('\n');

  // 2️⃣ Vector search
  const embedding = await embedText(question);
  const chunks = await searchVectors(embedding, workspaceId);

  if (!chunks.length) {
    res.write(`data: I couldn't find relevant information in your documents.\n\n`);
    return;
  }

  const context = chunks
    .map((c, i) => `Source ${i + 1}:\n${c.text}`)
    .join('\n\n');

  // 3️⃣ Prompt
  const prompt = `
You are an AI assistant.
Answer the question ONLY using the context below.
If the answer is not present, say "I don't know".

${history ? `Conversation:\n${history}\n\n` : ''}Context:
${context}

Question:
${question}
`;

  // 4️⃣ Gemini streaming
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const result = await model.generateContentStream(prompt);

  let fullAnswer = '';

  // Stream tokens as they arrive
  for await (const chunk of result.stream) {
    const chunkText = chunk.text();
    if (chunkText) {
      fullAnswer += chunkText;
      // Send token to client via SSE
      res.write(`data: ${chunkText}\n\n`);
    }
  }

  // 5️⃣ Save memory (after stream completes)
  if (chatId) {
    await saveMessage(chatId, 'user', question);
    await saveMessage(chatId, 'assistant', fullAnswer);
  }

  // 6️⃣ Cache final answer (complete response only)
  await setCachedRagAnswer(workspaceId, question, {
    answer: fullAnswer,
    sources: chunks.map((c, i) => ({
      index: i + 1,
      documentId: c.documentId,
      score: c.score
    }))
  });
};
