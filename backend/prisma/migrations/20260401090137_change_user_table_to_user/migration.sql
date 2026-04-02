/*
  Warnings:

  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "user" (
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

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");
