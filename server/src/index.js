import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import webhookRoutes from './routes/webhooks.js';
import adminRoutes from './routes/admin.js';
import templateRulesRoutes from './routes/templateRules.js';
import sendgridWebhookRoutes from './routes/sendgridWebhook.js';
import './config/database.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:5173',  // Local development
    'https://license-manager-lovat.vercel.app'  // Production frontend
  ],
  credentials: true
}));

// Webhook route needs raw body
app.use('/webhooks/sendgrid', express.raw({ type: 'application/json' }), sendgridWebhookRoutes);
app.use('/webhooks', express.raw({ type: 'application/json' }), webhookRoutes);



// JSON parsing for all other routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin', templateRulesRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'License Manager API',
    version: '1.0.0',
    status: 'running'
  });
});

// 404 handler for undefined routes
app.use((req, res, next) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    availableRoutes: [
      'GET /',
      'GET /health',
      'GET /auth/install',
      'GET /auth/callback',
      'POST /webhooks/orders/create',
      'GET /api/admin/*'
    ]
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Database connection errors
  if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ECONNREFUSED') {
    return res.status(503).json({
      error: 'Database Unavailable',
      message: 'Unable to connect to database. Please try again in a moment.'
    });
  }
  
  // Send generic error response
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 CORS enabled for:`, ['http://localhost:5173', 'https://license-manager-lovat.vercel.app']);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});