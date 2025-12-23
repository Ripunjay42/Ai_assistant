import { Router } from 'express';
import { chatWithDocuments } from '../controllers/chat.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/query', authMiddleware, chatWithDocuments);

export default router;
