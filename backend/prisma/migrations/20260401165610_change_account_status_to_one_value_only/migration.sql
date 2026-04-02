/*
  Warnings:

  - The values [INACTIVE] on the enum `account_status` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "account_status_new" AS ENUM ('ACTIVE', 'SET_UP', 'BANNED');
ALTER TABLE "user" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "user" ALTER COLUMN "status" TYPE "account_status_new" USING ("status"::text::"account_status_new");
ALTER TYPE "account_status" RENAME TO "account_status_old";
ALTER TYPE "account_status_new" RENAME TO "account_status";
DROP TYPE "account_status_old";
ALTER TABLE "user" ALTER COLUMN "status" SET DEFAULT 'SET_UP';
COMMIT;

-- AlterTable
ALTER TABLE "user" ALTER COLUMN "status" SET NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'SET_UP',
ALTER COLUMN "status" SET DATA TYPE "account_status";
