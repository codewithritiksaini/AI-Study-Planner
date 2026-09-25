import app from './app.js';
import { env } from './config/env.js';

const PORT = env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 AI Study Planner API Server running on port ${PORT}`);
  console.log(`📡 Environment: ${env.NODE_ENV}`);
  console.log(`🔗 Healthcheck: http://localhost:${PORT}/api/health`);
  console.log(`======================================================\n`);
});

// Graceful shutdown on process signals
const shutdown = (signal) => {
  console.log(`\n🛑 Received ${signal}. Shutting down server gracefully...`);
  server.close(() => {
    console.log('✅ HTTP server closed. Process exiting.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
