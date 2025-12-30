import db from '../../models/index.js';
import { readFileFromS3 } from '../services/s3-reader.service.js';
import { extractText } from '../services/text-extractor.service.js';
import { chunkText } from '../services/chunker.service.js';
import { generateEmbeddings } from '../services/embedding.service.js';
import { qdrantClient } from '../../config/vector.js';
import { randomUUID } from 'crypto';


const COLLECTION = 'documents';
const CONCURRENCY = 3; // Process 3 documents concurrently

// Extract processing logic into separate function
const processDocument = async (job) => {
  const { documentId, workspaceId, bucket, s3Key } = job;
  
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

  console.log(`Document ready: ${documentId}`);
};

export const startDocumentConsumer = (channel, queueName) => {
  // Set prefetch to allow concurrent processing
  channel.prefetch(CONCURRENCY);
  console.log(`Document consumer started with concurrency: ${CONCURRENCY}`);

  channel.consume(queueName, async (msg) => {
    if (!msg) return;

    try {
      const job = JSON.parse(msg.content.toString());
      console.log('Received job:', job);

      await processDocument(job);

      channel.ack(msg);
    } catch (err) {
      console.error('Failed job:', err);
      
      // Update document status to FAILED
      try {
        const job = JSON.parse(msg.content.toString());
        await db.Document.update(
          { status: 'FAILED' },
          { where: { id: job.documentId } }
        );
      } catch (updateErr) {
        console.error('Failed to update document status:', updateErr);
      }

      // Don't requeue failed messages
      channel.nack(msg, false, false);
    }
  });
};
