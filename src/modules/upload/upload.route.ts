import { Router } from 'express';
import { uploadImagesController, uploadDocumentController } from './upload.controller';
import { upload } from '../../core/middlewares/upload.middleware';
import { protect } from '../../core/middlewares/auth.middleware';

const router = Router();

// Route for uploading multiple property images (up to 10 files)
router.post('/images', protect, upload.array('images', 10), uploadImagesController);

// Route for uploading a single document (like PDF)
router.post('/document', protect, upload.single('document'), uploadDocumentController);

export default router;
