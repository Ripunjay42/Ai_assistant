import { GetObjectCommand } from '@aws-sdk/client-s3';
import { s3 } from '../../config/s3.js';

export const readFileFromS3 = async (bucket, key) => {
  const response = await s3.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key
    })
  );

  const chunks = [];
  for await (const chunk of response.Body) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
};
