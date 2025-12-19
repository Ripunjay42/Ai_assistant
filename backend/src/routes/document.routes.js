import { Router } from 'express';
import { uploadDocument } from '../controllers/document.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { upload } from '../config/upload.js';

const router = Router();

router.post('/upload',
  authMiddleware,
  upload.single('file'),
  uploadDocument
);

export default router;
