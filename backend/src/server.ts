import app from './app';
import { connectDB } from './core/config/database';

const PORT = process.env.SERVER_PORT || 3000;

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