/*
  Warnings:

  - You are about to drop the column `districtId` on the `ward` table. All the data in the column will be lost.
  - You are about to drop the `district` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ward" DROP CONSTRAINT "ward_districtId_fkey";

-- AlterTable
ALTER TABLE "notification" ALTER COLUMN "content" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ward" DROP COLUMN "districtId";

-- DropTable
DROP TABLE "district";
