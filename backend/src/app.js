import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import errorHandler from './middlewares/error.middleware.js';

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "https://query-quill-nu.vercel.app/",
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['content-type', 'authorization'],
  exposedHeaders: ['content-type', 'authorization']
}));

app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api', routes);
app.use(errorHandler);

export default app;
