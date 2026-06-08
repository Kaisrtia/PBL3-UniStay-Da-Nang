CREATE TABLE "user_block" (
  "blockerId" TEXT NOT NULL,
  "blockedId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "user_block_pkey" PRIMARY KEY ("blockerId", "blockedId")
);

CREATE INDEX "user_block_blockedId_idx" ON "user_block"("blockedId");

ALTER TABLE "user_block"
  ADD CONSTRAINT "user_block_blockerId_fkey"
  FOREIGN KEY ("blockerId") REFERENCES "user"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_block"
  ADD CONSTRAINT "user_block_blockedId_fkey"
  FOREIGN KEY ("blockedId") REFERENCES "user"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_block"
  ADD CONSTRAINT "user_block_no_self_block"
  CHECK ("blockerId" <> "blockedId");
