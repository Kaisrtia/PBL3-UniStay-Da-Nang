import prismaClient from './prisma';

const connectDB = async () => {
  try {
    await prismaClient.$connect();
    console.log('Connected to database');
  } catch (error: any) {
    console.error('Error connecting to database: ', error.message);
  }
};

const disconnectDB = async () => {
  try {
    await prismaClient.$disconnect();
    console.log('Disconnected from database');
  } catch (error: any) {
    console.error('Error disconnecting from database: ', error.message);
    process.exit(1);
  }
};

export { connectDB, disconnectDB };
