import { Router } from 'express';
import { chatWithDocuments } from '../controllers/chat.controller.js';
import { streamChat } from '../controllers/chat.stream.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { rateLimit } from '../middlewares/rateLimit.middleware.js';

const router = Router();

// Regular chat (JSON response)
router.post('/query', authMiddleware, rateLimit, chatWithDocuments);

// Streaming chat (SSE response)
router.post('/stream', authMiddleware, rateLimit, streamChat);

export default router;
