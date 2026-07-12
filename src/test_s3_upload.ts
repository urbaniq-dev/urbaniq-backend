import dotenv from 'dotenv';
import sharp from 'sharp';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import s3Client from './config/s3';

dotenv.config();

const testBucketName = process.env.AWS_S3_BUCKET_NAME;
const testRegion = process.env.AWS_REGION || 'us-east-1';

console.log('--- AWS S3 Config Test ---');
console.log('Bucket Name:', testBucketName);
console.log('Region:', testRegion);
console.log('Access Key ID:', process.env.AWS_ACCESS_KEY_ID ? '***' + process.env.AWS_ACCESS_KEY_ID.slice(-4) : 'Not configured');
console.log('Secret Key:', process.env.AWS_SECRET_ACCESS_KEY ? 'Present' : 'Not configured');

const runTest = async () => {
  if (!testBucketName || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.error('\n❌ ERROR: AWS credentials and bucket name are not fully configured in your backend .env file.');
    console.error('Please configure AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_S3_BUCKET_NAME in backend .env.');
    process.exit(1);
  }

  try {
    console.log('\n1. Creating dummy image buffer (a solid blue 100x100 square)...');
    const dummyImageBuffer = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 0, g: 0, b: 255 } // Blue square
      }
    })
    .png()
    .toBuffer();

    console.log('✓ Dummy buffer created successfully.');

    console.log('\n2. Compressing dummy buffer to WebP with Sharp...');
    const originalWebP = await sharp(dummyImageBuffer)
      .webp({ quality: 80 })
      .toBuffer();
    console.log('✓ Original WebP compressed successfully.');

    console.log('\n3. Resizing and compressing dummy buffer to Thumbnail with Sharp...');
    const thumbnailWebP = await sharp(dummyImageBuffer)
      .resize(50, 50)
      .webp({ quality: 70 })
      .toBuffer();
    console.log('✓ Thumbnail WebP created successfully.');

    console.log('\n4. Uploading Original to S3...');
    const originalKey = `test/original-${Date.now()}.webp`;
    await s3Client.send(new PutObjectCommand({
      Bucket: testBucketName,
      Key: originalKey,
      Body: originalWebP,
      ContentType: 'image/webp'
    }));
    const originalUrl = `https://${testBucketName}.s3.${testRegion}.amazonaws.com/${originalKey}`;
    console.log('✓ Original uploaded successfully. S3 URL:', originalUrl);

    console.log('\n5. Uploading Thumbnail to S3...');
    const thumbnailKey = `test/thumbnail-${Date.now()}.webp`;
    await s3Client.send(new PutObjectCommand({
      Bucket: testBucketName,
      Key: thumbnailKey,
      Body: thumbnailWebP,
      ContentType: 'image/webp'
    }));
    const thumbnailUrl = `https://${testBucketName}.s3.${testRegion}.amazonaws.com/${thumbnailKey}`;
    console.log('✓ Thumbnail uploaded successfully. S3 URL:', thumbnailUrl);

    console.log('\n🎉 SUCCESS! Both image compression and S3 bucket uploading are fully operational.');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ FAILURE: An error occurred during the test:');
    console.error(error.stack || error.message || error);
    process.exit(1);
  }
};

runTest();
