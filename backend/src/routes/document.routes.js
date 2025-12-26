import { Router } from 'express';
import { uploadDocument, getDocuments, deleteDocument } from '../controllers/document.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { upload } from '../config/upload.js';

const router = Router();

router.post('/upload',
  authMiddleware,
  upload.single('file'),
  uploadDocument
);

router.get('/',
  authMiddleware,
  getDocuments
);

router.delete('/:id',
  authMiddleware,
  deleteDocument
);

export default router;
