-- AlterEnum
ALTER TYPE "account_status" ADD VALUE 'LOCKED';

-- AlterTable
ALTER TABLE "user" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

-- CreateTable
CREATE TABLE "email_verification" (
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_verification_pkey" PRIMARY KEY ("email")
);

-- CreateIndex
CREATE UNIQUE INDEX "email_verification_email_key" ON "email_verification"("email");

-- AddForeignKey
ALTER TABLE "email_verification" ADD CONSTRAINT "email_verification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
