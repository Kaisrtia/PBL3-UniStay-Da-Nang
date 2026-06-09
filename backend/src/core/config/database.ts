import prismaClient from './prisma';

const connectDB = async () => {
  try {
    await prismaClient.$connect();
    console.log('Connected to database');
  } catch (error) {
    console.error('Error connecting to database:', error);
    throw error;
  }
};

const disconnectDB = async () => {
  try {
    await prismaClient.$disconnect();
    console.log('Disconnected from database');
  } catch (error) {
    console.error('Error disconnecting from database:', error);
    throw error;
  }
};

export { connectDB, disconnectDB };
