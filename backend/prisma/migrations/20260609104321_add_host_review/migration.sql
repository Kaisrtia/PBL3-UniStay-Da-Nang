-- CreateTable
CREATE TABLE "host_review" (
    "id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "host_review_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "host_review_hostId_createdAt_idx" ON "host_review"("hostId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "host_review_reviewerId_hostId_key" ON "host_review"("reviewerId", "hostId");

-- AddForeignKey
ALTER TABLE "host_review" ADD CONSTRAINT "host_review_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "host_review" ADD CONSTRAINT "host_review_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
