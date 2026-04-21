import { PrismaClient } from '@prisma/client';
import config from './config';

const prismaClient = new PrismaClient({
  log: config.node_env === 'development' ? ['error', 'warn'] : ['error']
});

export default prismaClient;
