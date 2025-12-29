import 'dotenv/config';
import db from '../models/index.js';
import { initRabbitMQ, getChannel, QUEUE } from '../config/rabbitmq.js';
import { startDocumentConsumer } from './consumers/document.consumer.js';

const startWorker = async () => {
  try {
    await db.init();
    await initRabbitMQ();

    const channel = getChannel();

    startDocumentConsumer(channel, QUEUE);

    console.log('Document ingestion worker started');
  } catch (err) {
    console.error('Worker startup failed:', err);
    process.exit(1);
  }
};

startWorker();

process.stdin.resume();
