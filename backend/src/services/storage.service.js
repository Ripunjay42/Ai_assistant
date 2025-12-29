import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { s3 } from '../config/s3.js';
import { v4 as uuidv4 } from 'uuid';

export const uploadToS3 = async (file, workspaceId) => {
  const key = `documents/${workspaceId}/${uuidv4()}-${file.originalname}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype
    })
  );

  const url = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

  return {
    key,
    url
  };
};

export const deleteFromS3 = async (s3Key) => {
  try {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: s3Key
      })
    );
    console.log(`Deleted from S3: ${s3Key}`);
  } catch (error) {
    console.error('Failed to delete from S3:', error.message);
    throw error;
  }
};
