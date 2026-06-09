-- Existing sessions contain raw refresh tokens. Invalidate them during the
-- one-time migration instead of carrying insecure values forward.
DELETE FROM "session";

ALTER TABLE "session" RENAME COLUMN "token" TO "tokenHash";
ALTER TABLE "session" ALTER COLUMN "tokenHash" TYPE CHAR(64);
ALTER INDEX "session_token_key" RENAME TO "session_tokenHash_key";

CREATE INDEX "session_userId_idx" ON "session"("userId");
CREATE INDEX "session_expiresAt_idx" ON "session"("expiresAt");

ALTER TABLE "session"
ADD CONSTRAINT "session_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "user"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
