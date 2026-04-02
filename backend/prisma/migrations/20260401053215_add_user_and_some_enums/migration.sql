-- CreateEnum
CREATE TYPE "account_status" AS ENUM ('ACTIVE', 'INACTIVE', 'BANNED');

-- CreateEnum
CREATE TYPE "account_role" AS ENUM ('ADMIN', 'USER', 'STUDENT', 'HOST');

-- CreateTable
CREATE TABLE "User" (
    "id" VARCHAR(30) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "hashedPassword" TEXT NOT NULL,
    "fullName" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(15) NOT NULL,
    "dob" TIMESTAMP(3) NOT NULL,
    "gender" VARCHAR(10) NOT NULL,
    "avatarUrl" TEXT,
    "status" "account_status"[] DEFAULT ARRAY['ACTIVE']::"account_status"[],
    "roles" "account_role"[] DEFAULT ARRAY['USER']::"account_role"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
