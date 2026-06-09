-- The email column is already covered by email_verification_pkey.
DROP INDEX IF EXISTS "email_verification_email_key";

CREATE INDEX "post_status_createdAt_idx"
ON "post"("status", "createdAt");

CREATE INDEX "post_status_wardId_createdAt_idx"
ON "post"("status", "wardId", "createdAt");

CREATE INDEX "post_userId_createdAt_idx"
ON "post"("userId", "createdAt");

CREATE INDEX "post_status_price_idx"
ON "post"("status", "price");

CREATE INDEX "post_status_area_idx"
ON "post"("status", "area");

CREATE INDEX "post_createdAt_idx"
ON "post"("createdAt");

CREATE INDEX "post_image_postId_idx"
ON "post_image"("postId");

CREATE INDEX "post_amenity_amenityId_postId_idx"
ON "post_amenity"("amenityId", "postId");

CREATE INDEX "accomodation_request_userId_createdAt_idx"
ON "accomodation_request"("userId", "createdAt");

CREATE INDEX "comment_postId_status_parentId_createdAt_idx"
ON "comment"("postId", "status", "parentId", "createdAt");

CREATE INDEX "comment_parentId_status_createdAt_idx"
ON "comment"("parentId", "status", "createdAt");

CREATE INDEX "report_postId_idx"
ON "report"("postId");

CREATE INDEX "notification_userId_isRead_createdAt_idx"
ON "notification"("userId", "isRead", "createdAt" DESC);

CREATE INDEX "report_status_createdAt_idx"
ON "report"("status", "createdAt");

CREATE INDEX "email_verification_code_idx"
ON "email_verification"("code")
WHERE "code" IS NOT NULL;

CREATE INDEX "accomodation_request_postId_status_createdAt_idx"
ON "accomodation_request"("postId", "status", "createdAt");
