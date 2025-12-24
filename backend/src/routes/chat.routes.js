import { Router } from 'express';
import { chatWithDocuments } from '../controllers/chat.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { rateLimit } from '../middlewares/rateLimit.middleware.js';

const router = Router();

router.post('/query', authMiddleware, rateLimit, chatWithDocuments);

export default router;
