console.log('🔥 File index.ts được load!');

import { config } from './config/env';

import { logger } from './config/logger';
console.log('🔥 File logger.ts được load!');

import app from './app';
console.log('🔥 File app.ts được load!');

// import { connectDatabase, disconnectDatabase } from './config/database';
console.log('🔥 All imports loaded successfully!');

// Start server function
const startServer = async (): Promise<void> => {
  try {
    // Connect to database
    // await connectDatabase();
    console.log('🚀 Server start on port', config.port);

    // Start HTTP server
    console.log('👉 Debug app:', app);
    console.log('👉 Debug port:', config.port);

    const server = app.listen(config.port, () => {
      logger.info(`🚀 Server đang chạy trên port ${config.port}`);
      logger.info(`🌐 Environment: ${config.env}`);
      logger.info(
        `📋 API Documentation: http://localhost:${config.port}${config.api.prefix}/${config.api.version}`
      );
      logger.info(`💊 Health Check: http://localhost:${config.port}/ping`);
      logger.info(`🗄️  Database Viewer: http://localhost:${config.port}/database-viewer`);

      if (config.env === 'development') {
        logger.info(`🔍 Database Studio: npx prisma studio`);
        logger.info(`📊 API Endpoints:`);
        logger.info(
          `   - Health: http://localhost:${config.port}${config.api.prefix}/${config.api.version}/health`
        );
        logger.info(
          `   - Imaging: http://localhost:${config.port}${config.api.prefix}/${config.api.version}/imaging`
        );
        logger.info(
          `   - Graphics: http://localhost:${config.port}${config.api.prefix}/${config.api.version}/graphics`
        );
        logger.info(
          `   - PACS: http://localhost:${config.port}${config.api.prefix}/${config.api.version}/pacs`
        );
      }
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received, starting graceful shutdown...`);

      server.close(async () => {
        logger.info('HTTP server closed');

        // Disconnect from database
        // await disconnectDatabase();

        logger.info('Graceful shutdown completed');
        process.exit(0);
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 30000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};
console.log('🔥 Index.ts loaded, starting server...');

// Start the server
startServer();
