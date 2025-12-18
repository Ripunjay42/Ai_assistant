import app from './app.js';
import { env } from './config/env.js';
import db from './models/index.js';
import './config/redis.js';
import { initRabbitMQ } from './config/rabbitmq.js';
import qdrant from './config/vector.js';

const startServer = async () => {
  await db.init();
  await initRabbitMQ();

  const collections = await qdrant.getCollections();
  console.log(
    'Qdrant connected. Collections:',
    collections.collections.map(c => c.name)
  );

  app.listen(env.port, () => {
    console.log(`Server running on port ${env.port}`);
  });
};

startServer();
