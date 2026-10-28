import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { pool, connectDB, applySchema } from './db/index.js';

// Route imports
import donationRoutes from './routes/donationRoutes.js';
import requestRoutes from './routes/requestRoutes.js';
import deliveryRoutes from './routes/deliveryRoutes.js';
import userRoutes from './routes/userRoutes.js';
import statsRoutes from './routes/statsRoutes.js';
import seedRoutes from './routes/seedRoutes.js';
import authRoutes from './routes/authRoutes.js';
import aiRoutes from './routes/aiRoutes.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Database connection
connectDB();
applySchema();

// Health Check Endpoint
app.get('/api/health', async (_req, res) => {
  let database = 'disconnected';
  try {
    const result = await pool.query('SELECT NOW()');
    database = result.rows[0].now ? 'connected' : 'disconnected';
  } catch (_e) {
    database = 'disconnected';
  }
  res.status(200).json({
    ok: true,
    service: 'resqmeal-api',
    database,
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/seed', seedRoutes);
app.use('/api/ai', aiRoutes);

// 404 Handler
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'API Route Not Found' });
});

// Global Error Handler
app.use((err, _req, res, _next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ success: false, error: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 ResQMeal API listening on http://localhost:${PORT}`);
});
