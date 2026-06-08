ALTER TABLE "notification" ADD COLUMN "dedupeKey" VARCHAR(255);

CREATE UNIQUE INDEX "notification_dedupeKey_key" ON "notification"("dedupeKey");
