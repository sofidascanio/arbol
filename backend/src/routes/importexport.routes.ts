import { Router } from 'express';
import { verifyToken } from '@/middleware/auth';
import { validate } from '@/middleware/validate';
import { upload } from '@/middleware/upload';
import { exportValidations } from '@/schemas/importexport.schema';
import {
  exportBookmarksController,
  importBookmarks,
  previewImport,
} from '@/controllers/importexport.controller';

const router = Router();
router.use(verifyToken);

// GET /api/import-export/export 
router.get('/export', [...exportValidations, validate], exportBookmarksController);

// POST /api/import-export/import 
router.post('/import', upload.single('file'), importBookmarks);

// POST /api/import-export/preview 
router.post('/preview', upload.single('file'), previewImport);

export default router;