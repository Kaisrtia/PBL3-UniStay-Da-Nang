import { PrismaClient } from "@prisma/client";
import { nanoid } from "nanoid";

const prisma = new PrismaClient();

export const generateHybridId = (prefix: string) => {
  return prefix + nanoid();
}
