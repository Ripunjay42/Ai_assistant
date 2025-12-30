import 'dotenv/config';
import db from '../models/index.js';
import { initRabbitMQ, getChannel, QUEUE } from '../config/rabbitmq.js';
import { startDocumentConsumer } from './consumers/document.consumer.js';
import http from 'http';

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

// tiny health server
http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200);
    res.end('ok');
  } else {
    res.writeHead(404);
    res.end();
  }
}).listen(3001, () => {
  console.log(`Worker health endpoint running on port ${3001}`);
});

