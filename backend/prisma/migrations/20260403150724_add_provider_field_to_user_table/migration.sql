-- CreateEnum
CREATE TYPE "provider" AS ENUM ('GOOGLE', 'SYSTEM');

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "provider" "provider";
