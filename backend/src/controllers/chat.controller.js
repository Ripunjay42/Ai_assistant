import { runRAG } from '../services/rag.service.js';

export const chatWithDocuments = async (req, res) => {
  try {
    const { question, workspaceId, chatId } = req.body;

    if (!question || !workspaceId) {
      return res
        .status(400)
        .json({ message: 'question and workspaceId are required' });
    }

    const result = await runRAG({
      question,
      workspaceId,
      chatId
    });

    res.json(result);
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ message: 'Chat failed' });
  }
};
