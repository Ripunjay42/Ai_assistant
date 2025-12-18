import amqp from 'amqplib';

const QUEUE_NAME = 'document-ingestion';

let channel;

export const initRabbitMQ = async () => {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();

    await channel.assertQueue(QUEUE_NAME, {
      durable: true
    });

    console.log('RabbitMQ connected (CloudAMQP)');
  } catch (err) {
    console.error('RabbitMQ connection failed:', err);
    process.exit(1);
  }
};

export const getChannel = () => channel;
export const QUEUE = QUEUE_NAME;
