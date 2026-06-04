import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import { auth } from 'express-openid-connect';
import connectDB from './config/db.js';
import courseRoutes from './routes/courseRoutes.js';
import tutorRoutes from './routes/tutorRoutes.js';
import { protect } from './middlewares/authMiddleware.js';

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Auth0 OIDC session configurations
const oidcConfig = {
  authRequired: false,
  auth0Logout: true,
  secret: process.env.SESSION_SECRET || 'a-long-random-string-at-least-32-characters-long',
  baseURL: process.env.BASE_URL || 'http://localhost:5174',
  clientID: process.env.AUTH0_CLIENT_ID || '22dA63hPklbjnhB97sNTYv5nFZlAGY50',
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL || 'https://dev-1ppds1up31cu6c8y.jp.auth0.com',
  routes: {
    login: '/auth/login',
    logout: '/auth/logout',
    callback: '/auth/callback'
  }
};

// Middleware
app.use(cors({
  origin: 'http://localhost:5174',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Http request logging
if (NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Mount OIDC Session Auth handler
app.use(auth(oidcConfig));

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
