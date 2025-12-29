import { streamRAG } from '../services/rag-stream.service.js';

export const streamChat = async (req, res) => {
  const { question, workspaceId, chatId } = req.body;

  if (!question || !workspaceId) {
    return res.status(400).json({
      message: 'question and workspaceId required'
    });
  }

  //  SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    await streamRAG({
      question,
      workspaceId,
      chatId,
      res
    });

    // 🔚 Signal completion
    res.write(`event: done\ndata: end\n\n`);
    res.end();
  } catch (err) {
    console.error('Streaming error:', err);
    res.write(`event: error\ndata: ${err.message}\n\n`);
    res.end();
  }
};
