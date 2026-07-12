import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import s3Client from '../../config/s3';
import crypto from 'crypto';

// Use memory storage to process file buffers in memory
const storage = multer.memoryStorage();
export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and documents (PDFs)
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and PDFs are allowed.'));
    }
  },
});

export interface UploadedImage {
  original: string;
  thumbnail: string;
}

export const uploadToS3 = async (
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<string> => {
  const bucketName = process.env.AWS_S3_BUCKET_NAME;
  const region = process.env.AWS_REGION || 'us-east-1';

  if (!bucketName) {
    throw new Error('AWS_S3_BUCKET_NAME is not configured in environment variables.');
  }

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await s3Client.send(command);
  return `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
};

/**
 * Helper to process an image buffer and upload both original and thumbnail to S3
 */
export const processAndUploadImage = async (
  file: Express.Multer.File
): Promise<UploadedImage> => {
  const fileId = crypto.randomUUID();
  const originalKey = `properties/originals/${fileId}.webp`;
  const thumbnailKey = `properties/thumbnails/${fileId}.webp`;

  // 1. Compress original to WebP (quality 80)
  const originalBuffer = await sharp(file.buffer)
    .webp({ quality: 80 })
    .toBuffer();

  // 2. Resize and compress to thumbnail (webp, 400x300, fit cover)
  const thumbnailBuffer = await sharp(file.buffer)
    .resize(400, 300, { fit: 'cover' })
    .webp({ quality: 70 })
    .toBuffer();

  // 3. Upload both to S3
  const [originalUrl, thumbnailUrl] = await Promise.all([
    uploadToS3(originalBuffer, originalKey, 'image/webp'),
    uploadToS3(thumbnailBuffer, thumbnailKey, 'image/webp'),
  ]);

  return {
    original: originalUrl,
    thumbnail: thumbnailUrl,
  };
};

/**
 * Helper to upload a document (like a PDF) to S3 without compression
 */
export const uploadDocument = async (
  file: Express.Multer.File
): Promise<string> => {
  const fileId = crypto.randomUUID();
  const extension = file.originalname.split('.').pop() || 'pdf';
  const key = `properties/documents/${fileId}.${extension}`;

  return await uploadToS3(file.buffer, key, file.mimetype);
};
