/*
  Warnings:

  - You are about to drop the column `userId` on the `email_verification` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "email_verification" DROP CONSTRAINT "email_verification_userId_fkey";

-- AlterTable
ALTER TABLE "email_verification" DROP COLUMN "userId",
ALTER COLUMN "code" DROP NOT NULL,
ALTER COLUMN "expiresAt" DROP NOT NULL;
