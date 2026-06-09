import app from './app';
import { connectDB, disconnectDB } from './core/config/database';
import config from './core/config/config';
import { cacheConnection, connection } from './core/config/redis.connection';
import { imageModerationWorker } from './modules/post/workers/image.moderation.worker';
import { textModerationWorker } from './modules/post/workers/text.moderation.worker';
import { finalModerationWorker } from './modules/post/workers/finalStatus.moderation.worker';
import { postCacheWorker } from './modules/post/workers/cache.worker';
import { matchDemandWorker } from './modules/post/workers/matchDemand.worker';
import { demandCacheWorker } from './modules/demand/workers/cache.worker';
import {
  automatedCensorNotificationWorker,
  manualCensorNotificationWorker
} from './modules/notification/workers/censorPost.notification';
import { commentNotificationWorker } from './modules/notification/workers/comment.worker';
import { accommodationNotificationWorker } from './modules/notification/workers/requestAccomodation.worker';
import {
  initCacheJob,
  postCacheQueue
} from './modules/post/queues/cache.queue';
import {
  demandCacheQueue,
  initDemandCacheJob
} from './modules/demand/queues/cache.queue';
import { matchDemandQueue } from './modules/post/queues/matchDemand.queue';
import {
  finalStatusQueue,
  flowProducer,
  imageModerationQueue,
  textModerationQueue
} from './modules/post/queues/moderation.queue';
import {
  censorAutomaticalNotificationQueue,
  censorManualNotificationQueue,
  commentNotificationQueue,
  requestSharedAccommodationNotificationQueue
} from './modules/notification/queues/notification.queue';

const PORT = config.server.port;

const workers = [
  imageModerationWorker,
  textModerationWorker,
  finalModerationWorker,
  postCacheWorker,
  matchDemandWorker,
  demandCacheWorker,
  automatedCensorNotificationWorker,
  manualCensorNotificationWorker,
  commentNotificationWorker,
  accommodationNotificationWorker
];

const queues = [
  postCacheQueue,
  demandCacheQueue,
  matchDemandQueue,
  finalStatusQueue,
  imageModerationQueue,
  textModerationQueue,
  censorAutomaticalNotificationQueue,
  censorManualNotificationQueue,
  commentNotificationQueue,
  requestSharedAccommodationNotificationQueue
];

const closeBackgroundResources = async (force = false) => {
  await Promise.allSettled(workers.map((worker) => worker.close(force)));
  await Promise.allSettled([
    ...queues.map((queue) => queue.close()),
    flowProducer.close()
  ]);
};

const waitForCacheConnectionReady = async () => {
  if (cacheConnection.status === 'ready') return;

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Redis cache connection timed out'));
    }, 5000);

    const cleanup = () => {
      clearTimeout(timeout);
      cacheConnection.off('ready', handleReady);
      cacheConnection.off('error', handleError);
    };

    const handleReady = () => {
      cleanup();
      resolve();
    };

    const handleError = (error: Error) => {
      cleanup();
      reject(error);
    };

    cacheConnection.once('ready', handleReady);
    cacheConnection.once('error', handleError);
  });
};

const startServer = async () => {
  try {
    await connectDB();
    await waitForCacheConnectionReady();
    await cacheConnection.ping();
    await initCacheJob();
    await initDemandCacheJob();

    const server = app.listen(PORT, () => {
      console.log(`Server is listening on port ${PORT}`);
    });

    let shuttingDown = false;
    const gracefulShutdown = async (signal: string) => {
      if (shuttingDown) return;
      shuttingDown = true;

      console.log(`Received ${signal}, shutting down gracefully...`);
      server.close();

      const forceShutdownTimer = setTimeout(() => {
        console.error('Graceful shutdown timed out');
        server.closeAllConnections();
        process.exit(1);
      }, 10_000);
      forceShutdownTimer.unref();

      try {
        await closeBackgroundResources();
        await disconnectDB();
        await Promise.allSettled([
          cacheConnection.quit(),
          connection.quit()
        ]);
        server.closeAllConnections();
        clearTimeout(forceShutdownTimer);
        process.exit(0);
      } catch (error) {
        console.error('Error during shutdown:', error);
        server.closeAllConnections();
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => void gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => void gracefulShutdown('SIGINT'));
    process.on('SIGUSR2', () => void gracefulShutdown('SIGUSR2'));
  } catch (error) {
    console.error('Failed to start the server:', error);
    await Promise.race([
      closeBackgroundResources(true),
      new Promise((resolve) => setTimeout(resolve, 2000))
    ]);
    cacheConnection.disconnect();
    connection.disconnect();
    await Promise.allSettled([disconnectDB()]);
    process.exit(1);
  }
};

void startServer();
