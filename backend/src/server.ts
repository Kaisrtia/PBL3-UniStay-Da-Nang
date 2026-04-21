import app from './app';
import { connectDB } from './core/config/database';

// Initialize Background Workers
import './modules/post/workers/image.moderation.worker';
import './modules/post/workers/text.moderation.worker';
import './modules/post/workers/finalStatus.moderation.worker';
import './modules/notification/workers/censorPost.notification';

import config from './core/config/config';

const PORT = config.server.port;

const startServer = () => {
  try {
    app.listen(PORT, () => {
      console.log(`Server is listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start the server:', error);
    process.exit(1);
  }
};

startServer();

connectDB();
