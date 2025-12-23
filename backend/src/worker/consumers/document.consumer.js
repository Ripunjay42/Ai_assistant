import db from '../../models/index.js';
import { readFileFromS3 } from '../services/s3-reader.service.js';
import { extractText } from '../services/text-extractor.service.js';
import { chunkText } from '../services/chunker.service.js';
import { generateEmbeddings } from '../services/embedding.service.js';
import { qdrantClient } from '../../config/vector.js';
import { randomUUID } from 'crypto';


const COLLECTION = 'documents';

export const startDocumentConsumer = (channel, queueName) => {
  channel.consume(queueName, async (msg) => {
    if (!msg) return;

    const job = JSON.parse(msg.content.toString());
    console.log('Received job:', job);
    const { documentId, workspaceId, bucket, s3Key } = job;

    try {
      console.log(`Processing document: ${documentId}`);

      await db.Document.update(
        { status: 'PROCESSING' },
        { where: { id: documentId } }
      );

      const fileBuffer = await readFileFromS3(bucket, s3Key);
      const text = await extractText(fileBuffer, s3Key);
      const chunks = chunkText(text);
      const embeddings = await generateEmbeddings(chunks);

        const points = embeddings.map((e, index) => ({
        id: randomUUID(),
        vector: e.embedding,
        payload: {
          documentId,
          workspaceId,
          chunkIndex: index,
          text: chunks[index]
        }
      }));

      console.log('Points to be inserted:', {
        totalPoints: points.length,
        samplePoint: points[0],
        vectorDimension: points[0]?.vector.length
      });

      await qdrantClient.upsert(COLLECTION, {
        points
      });



      await db.Document.update(
        { status: 'READY' },
        { where: { id: documentId } }
      );

      channel.ack(msg);
      console.log(`Document ready: ${documentId}`);
    } catch (err) {
      console.error(`Failed document ${documentId}`, err);

      await db.Document.update(
        { status: 'FAILED' },
        { where: { id: documentId } }
      );

      channel.nack(msg, false, false); // drop message
    }
  });
};
