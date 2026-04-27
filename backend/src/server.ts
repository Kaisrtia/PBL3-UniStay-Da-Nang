import app from './app';
import { connectDB, disconnectDB } from './core/config/database';

// Initialize Background Workers
import './modules/post/workers/image.moderation.worker';
import './modules/post/workers/text.moderation.worker';
import './modules/post/workers/finalStatus.moderation.worker';
import './modules/notification/workers/censorPost.notification';

import config from './core/config/config';

const PORT = config.server.port;
import { connection } from './core/config/redis.connection';

const startServer = () => {
  try {
    const server = app.listen(PORT, () => {
      console.log(`Server is listening on port ${PORT}`);
    });

    // Graceful Shutdown strategy for Linux environments (e.g., when running in Docker)
    // No need in windows because nodemon/ts-node-dev will automatically kill
    // the process and restart it, so we don't need to handle SIGUSR2 signal
    const gracefulShutdown = async (signal: string) => {
      console.log(`Received ${signal}, shutting down gracefully...`);
      server.close(async () => {
        try {
          console.log('Closed out remaining connections.');
          await disconnectDB();
          await connection.quit(); // Close Redis connection

          process.exit(0);
        } catch (err) {
          console.error('Error during shutdown:', err);
          process.exit(1);
        }
      });

      // Force close wait for 5s
      setTimeout(() => {
        console.error(
          'Could not close connections in time, forcefully shutting down'
        );
        process.exit(1);
      }, 5000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // commonly used by nodemon/ts-node-dev
  } catch (error) {
    console.error('Failed to start the server:', error);
    process.exit(1);
  }
};

startServer();

connectDB();
