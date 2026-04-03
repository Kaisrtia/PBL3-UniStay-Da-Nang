-- CreateEnum
CREATE TYPE "account_status" AS ENUM ('ACTIVE', 'LOCKED', 'SET_UP', 'BANNED');

-- CreateEnum
CREATE TYPE "account_role" AS ENUM ('ADMIN', 'USER', 'STUDENT', 'HOST');

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "hashedPassword" TEXT NOT NULL,
    "fullName" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(15),
    "dob" TIMESTAMP(3),
    "gender" VARCHAR(10),
    "avatarUrl" TEXT,
    "emailVerified" BOOLEAN DEFAULT false,
    "phoneVerified" BOOLEAN DEFAULT false,
    "status" "account_status" DEFAULT 'LOCKED',
    "roles" "account_role"[] DEFAULT ARRAY['USER']::"account_role"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_verification" (
    "email" TEXT NOT NULL,
    "code" TEXT,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "email_verification_pkey" PRIMARY KEY ("email")
);

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_phone_key" ON "user"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "email_verification_email_key" ON "email_verification"("email");
