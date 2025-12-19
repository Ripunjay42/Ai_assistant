import { PutObjectCommand } from '@aws-sdk/client-s3';
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
