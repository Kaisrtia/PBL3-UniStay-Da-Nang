-- AlterTable
ALTER TABLE "notification" ADD COLUMN     "isRead" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "post" ADD COLUMN     "moderatorId" TEXT;

-- AddForeignKey
ALTER TABLE "post" ADD CONSTRAINT "post_moderatorId_fkey" FOREIGN KEY ("moderatorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
