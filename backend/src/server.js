import 'dotenv/config';
import express from 'express';

import db from './models/index.js';
import { connectRedis } from './config/redis.js';
import { initRabbitMQ } from './config/rabbitmq.js';
import { checkS3Connection } from './config/s3.js';
import { checkQdrantConnection } from './config/vector.js';
import routes from './routes/index.js';

const app = express();
app.use(express.json());
app.use('/api', routes);

const startServer = async () => {
  try {
    await db.init();
    await connectRedis();
    await initRabbitMQ();
    await checkS3Connection();
    await checkQdrantConnection();

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Server startup failed:', err);
    process.exit(1);
  }
};

startServer();
