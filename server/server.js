const express = require('express');
const path = require('path');
const routes = require('./routes');

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Create Express application
 */
const app = express();

/**
 * Middleware configuration
 */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * CORS middleware for development
 * Allow requests from any origin in development mode
 */
if (NODE_ENV === 'development') {
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });
}

/**
 * Request logging middleware
 */
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

/**
 * API Routes
 */
app.use('/api', routes);

/**
 * Serve static frontend files
 */
app.use(express.static(path.join(__dirname, '../client')));

/**
 * Frontend route handler - serve index.html for all non-API routes
 */
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

/**
 * Global error handling middleware
 */
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  // Don't send error details in production
  const message = NODE_ENV === 'development' ? error.message : 'Internal server error';
  const stack = NODE_ENV === 'development' ? error.stack : undefined;
  
  res.status(500).json({
    error: message,
    stack: stack,
    timestamp: new Date().toISOString()
  });
});

/**
 * Handle 404 errors
 */
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.url} not found`,
    timestamp: new Date().toISOString()
  });
});

/**
 * Start server
 */
const server = app.listen(PORT, () => {
  console.log(`\n=== Offline Git Visualizer Server ===`);
  console.log(`Environment: ${NODE_ENV}`);
  console.log(`Server running on: http://localhost:${PORT}`);
  console.log(`API endpoints:`);
  console.log(`  GET /api/commits?repoPath=<path> - Get commits from repository`);
  console.log(`  GET /api/health - Health check`);
  console.log(`\nPress Ctrl+C to stop the server\n`);
});

/**
 * Graceful shutdown
 */
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

/**
 * Handle uncaught exceptions
 */
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

module.exports = app;
