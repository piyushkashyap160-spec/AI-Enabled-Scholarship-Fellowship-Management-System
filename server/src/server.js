import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import connectDB from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';
import { initReminderService } from './services/reminderService.js';

// Route Imports
import authRoutes from './routes/authRoutes.js';
import schemeRoutes from './routes/schemeRoutes.js';
import eligibilityRoutes from './routes/eligibilityRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import verifierRoutes from './routes/verifierRoutes.js';
import officerRoutes from './routes/officerRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import chatbotRoutes from './routes/chatbotRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import disbursementRoutes from './routes/disbursementRoutes.js';
import mlRoutes from './routes/mlRoutes.js';

dotenv.config();

// Fail-fast in production if JWT_SECRET is missing
if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || !process.env.JWT_SECRET.trim())) {
  throw new Error('FATAL: JWT_SECRET environment variable must be explicitly defined in production.');
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Connect to MongoDB
connectDB();

// Allowed Origins Parser
const getAllowedOrigins = () => {
  const list = [];
  if (process.env.CLIENT_URL) list.push(process.env.CLIENT_URL.trim());
  if (process.env.ALLOWED_ORIGINS) {
    process.env.ALLOWED_ORIGINS.split(',').forEach(o => {
      const trimmed = o.trim();
      if (trimmed) list.push(trimmed);
    });
  }
  return list;
};

// Middlewares - Hardened CORS
app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. server-to-server, curl, tests)
    if (!origin) return callback(null, true);

    const isDev = process.env.NODE_ENV !== 'production';
    const isLocalhost = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

    if (isDev && isLocalhost) {
      return callback(null, true);
    }

    const allowed = getAllowedOrigins();
    if (allowed.includes(origin)) {
      return callback(null, true);
    }

    // Explicitly reject unauthorized cross-origin requests
    return callback(new Error(`Not allowed by CORS: Origin ${origin} is not authorized.`));
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// NOTE: Sensitive uploaded files are NOT served statically via /uploads.
// All documents must be accessed via authenticated endpoint GET /api/documents/:id/file

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'MoTA Scholarship & Fellowship Management System API',
    ps: 'SIH PS 26239',
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/schemes', schemeRoutes);
app.use('/api/eligibility', eligibilityRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/verifier', verifierRoutes);
app.use('/api/officer', officerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/disbursements', disbursementRoutes);
app.use('/api/ml', mlRoutes);

// Central Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5001;

const server = app.listen(PORT, () => {
  console.log(`\n================================================================`);
  console.log(`🏛️  MoTA Scholarship & Fellowship Management Backend`);
  console.log(`🚀  Server running on http://localhost:${PORT}`);
  console.log(`📊  API Health: http://localhost:${PORT}/api/health`);
  console.log(`================================================================\n`);

  // Start background reminder service
  initReminderService();
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n⚠️  [PORT ${PORT} IS BUSY]: Another process is already running on port ${PORT}.`);
    console.error(`💡 Tip: Change PORT in server/.env or stop the existing node process.\n`);
  } else {
    console.error(`[Server Error]:`, err.message);
  }
});

export default app;
