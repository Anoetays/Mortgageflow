import express from 'express';
import multer from 'multer';
import {
  uploadDocument,
  getDocumentUrl,
  deleteDocument,
  getApplicationDocuments,
} from '../controllers/documentsController.js';
import { authenticateToken, isOfficer } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Public - upload document for application
router.post('/upload', upload.single('file'), uploadDocument);

// Get documents for an application
router.get('/application/:applicationId', getApplicationDocuments);

// Get public URL for document
router.get('/url/:filePath', getDocumentUrl);

// Protected - delete document
router.delete('/:id', authenticateToken, isOfficer, deleteDocument);

export default router;
