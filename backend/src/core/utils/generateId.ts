import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// generate id for user
export const generateUserId = (role: string) => {
  if (role === 'ADMIN') {
    return 'AD_' + (Number(prisma.user.count()) + 1).toString();
  } else if (role === 'STUDENT') {
    return 'S_' + (Number(prisma.user.count()) + 1).toString();
  } else if (role === 'HOST') {
    return 'H_' + (Number(prisma.user.count()) + 1).toString();
  }
};