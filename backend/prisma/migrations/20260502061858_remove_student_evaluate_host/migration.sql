/*
  Warnings:

  - You are about to drop the `student_evaluate_host` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `reportedUserId` to the `report` table without a default value. This is not possible if the table is not empty.
  - Made the column `status` on table `user` required. This step will fail if there are existing NULL values in that column.
  - Made the column `provider` on table `user` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "student_evaluate_host" DROP CONSTRAINT "student_evaluate_host_hostId_fkey";

-- DropForeignKey
ALTER TABLE "student_evaluate_host" DROP CONSTRAINT "student_evaluate_host_studentId_fkey";

-- DropIndex
DROP INDEX "user_phone_key";

-- AlterTable
ALTER TABLE "accomodation_request" ALTER COLUMN "updatedAt" DROP NOT NULL,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "comment" ALTER COLUMN "updatedAt" DROP NOT NULL,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "notification" ALTER COLUMN "updatedAt" DROP NOT NULL,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "post" ALTER COLUMN "updatedAt" DROP NOT NULL,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "report" ADD COLUMN     "reportedUserId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "user" ALTER COLUMN "status" SET NOT NULL,
ALTER COLUMN "provider" SET NOT NULL,
ALTER COLUMN "provider" SET DEFAULT 'SYSTEM';

-- DropTable
DROP TABLE "student_evaluate_host";

-- AddForeignKey
ALTER TABLE "report" ADD CONSTRAINT "report_reportedUserId_fkey" FOREIGN KEY ("reportedUserId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
