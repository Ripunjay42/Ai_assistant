import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';
import 'dotenv/config';

export const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

export const checkS3Connection = async () => {
  try {
    await s3.send(
      new HeadBucketCommand({
        Bucket: process.env.AWS_S3_BUCKET
      })
    );

    console.log('AWS S3 connected');
  } catch (err) {
    console.error('AWS S3 connection failed:', err.message);
    process.exit(1);
  }
};
