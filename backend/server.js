import { setGlobalDispatcher, Agent } from 'undici';

// Configure global undici dispatcher to prevent connection/header timeout issues with long-running LLM API requests
setGlobalDispatcher(new Agent({
  headersTimeout: 300000, // 5 minutes in milliseconds
  bodyTimeout: 300000    // 5 minutes in milliseconds
}));

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import connectDB from './config/db.js';
import { getEnv } from './config/env.js';
import authRoutes from './routes/authRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import tutorRoutes from './routes/tutorRoutes.js';
import { protect } from './middlewares/authMiddleware.js';

// Connect to database
connectDB();

const app = express();
app.set('trust proxy', true);
const PORT = getEnv('PORT', 5000);
const NODE_ENV = getEnv('NODE_ENV', 'development');


// Middleware
app.use(cors({
  origin: getEnv('FRONTEND_URL'),
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Http request logging
if (NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Mount Auth Routes (login, callback, logout)
app.use('/auth', authRoutes);

// Welcome / Root Endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to GenCourse AI Backend API',
    status: 'online',
    version: '1.0.0'
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: NODE_ENV
  });
});

// Auth endpoints
app.get('/api/auth/me', protect, (req, res) => {
  res.json(req.user);
});

// API Routes
app.use('/api/courses', courseRoutes);
app.use('/api/tutor', tutorRoutes);

// 404 Route handler
app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
});

// Global Error Handler
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: NODE_ENV === 'production' ? '🥞' : err.stack
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running in ${NODE_ENV} mode on port ${PORT}`);
});
