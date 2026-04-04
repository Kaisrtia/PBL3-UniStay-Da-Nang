import { PrismaClient } from '@prisma/client';
import config from './config';

const prisma = new PrismaClient({
  log:
    config.node_env === 'development' ? ['query', 'error', 'warn'] : ['error']
});

const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log('Connected to database');
  } catch (error: any) {
    console.error('Error connecting to database: ', error.message);
  }
};

const disconnectDB = async () => {
  try {
    await prisma.$disconnect();
    console.log('Disconnected from database');
  } catch (error: any) {
    console.error('Error disconnecting from database: ', error.message);
    process.exit(1);
  }
};

export { prisma, connectDB, disconnectDB };
