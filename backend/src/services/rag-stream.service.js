import { GoogleGenerativeAI } from "@google/generative-ai";
import { embedText } from "./gemini-embedding.service.js";
import { searchVectors } from "./vector-search.service.js";
import {
  getCachedRagAnswer,
  setCachedRagAnswer,
} from "./rag-cache.service.js";
import {
  getChatMemory,
  saveMessage,
} from "./chat-memory.service.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const streamRAG = async ({
  question,
  workspaceId,
  chatId,
  res,
}) => {
  try {
    // =========================
    // 1️⃣ Cache Check
    // =========================
    const cached = await getCachedRagAnswer(workspaceId, question);
    if (cached) {
      console.log("RAG cache hit (streaming)");
      res.write(`data: ${cached.answer}\n\n`);
      res.write(`data: [DONE]\n\n`);
      return;
    }

    // =========================
    // 2️⃣ Chat Memory
    // =========================
    const memory = chatId ? await getChatMemory(chatId) : [];
    const history = memory
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n");

    // =========================
    // 3️⃣ Vector Search
    // =========================
    const embedding = await embedText(question);
    const chunks = await searchVectors(embedding, workspaceId);

    // Limit context size (prevents 400 error due to large prompt)
    const context = chunks
      .slice(0, 5)
      .map((c, i) => `Source ${i + 1}:\n${c.text.substring(0, 2000)}`)
      .join("\n\n");

    // =========================
    // 4️⃣ Prompt
    // =========================
    const prompt = `
You are a helpful AI assistant.

Use the CONVERSATION HISTORY to understand follow-up questions and user intent.

If relevant information is available in the CONTEXT, use it to provide an accurate, grounded answer.
If the CONTEXT does not contain relevant information or is empty, answer using your general knowledge.

IMPORTANT RULES:
- Do NOT mention documents, context, or lack of information.
- Do NOT explain reasoning.
- Simply answer clearly and concisely.
- Do not invent facts.

At the end of your response, add ONE source tag:
- [Source: Documents]
- [Source: General Knowledge]

${history ? `CONVERSATION HISTORY:\n${history}\n\n` : ""}

CONTEXT:
${context}

QUESTION:
${question}
`;

    // =========================
    // 5️⃣ Gemini Model Setup
    // =========================
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    });

    // =========================
    // 6️⃣ Streaming Call (FIXED FORMAT)
    // =========================
    const result = await model.generateContentStream({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
    });

    let fullAnswer = "";

    // =========================
    // 7️⃣ Stream Tokens
    // =========================
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      if (chunkText) {
        fullAnswer += chunkText;
        res.write(`data: ${chunkText}\n\n`);
      }
    }

    res.write(`data: [DONE]\n\n`);

    // =========================
    // 8️⃣ Save Memory
    // =========================
    if (chatId) {
      await saveMessage(chatId, "user", question);
      await saveMessage(chatId, "assistant", fullAnswer);
    }

    // =========================
    // 9️⃣ Cache Final Answer
    // =========================
    await setCachedRagAnswer(workspaceId, question, {
      answer: fullAnswer,
      sources: chunks.map((c, i) => ({
        index: i + 1,
        documentId: c.documentId,
        score: c.score,
      })),
    });

  } catch (error) {
    console.error("Gemini Streaming Error:", error?.response?.data || error);
    res.write(`data: Something went wrong while generating the response.\n\n`);
    res.write(`data: [DONE]\n\n`);
  }
};