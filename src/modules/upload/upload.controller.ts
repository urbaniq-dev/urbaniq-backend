import { Request, Response } from 'express';
import { catchAsync } from '../../core/utils/catchAsync';
import { processAndUploadImage, uploadDocument } from '../../core/middlewares/upload.middleware';

/**
 * Handle uploading multiple property images.
 * Compress to original & thumbnail, upload to S3, and return URLs.
 */
export const uploadImagesController = catchAsync(async (req: Request, res: Response) => {
  if (!req.files || !(req.files instanceof Array) || req.files.length === 0) {
    return res.status(400).json({ success: false, message: 'No images uploaded' });
  }

  const uploadPromises = req.files.map(file => processAndUploadImage(file));
  const results = await Promise.all(uploadPromises);

  res.status(200).json({
    success: true,
    message: 'Images uploaded and compressed successfully',
    data: results, // array of { original, thumbnail }
  });
});

/**
 * Handle uploading a single verification document (like PDF).
 * Upload to S3 without compression and return S3 URL.
 */
export const uploadDocumentController = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No document uploaded' });
  }

  const documentUrl = await uploadDocument(req.file);

  res.status(200).json({
    success: true,
    message: 'Document uploaded successfully',
    data: documentUrl,
  });
});
