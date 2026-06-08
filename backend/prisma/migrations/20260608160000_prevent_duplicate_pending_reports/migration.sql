WITH ranked_reports AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "userId", "postId"
      ORDER BY "createdAt", "id"
    ) AS row_number
  FROM "report"
  WHERE "status" = 'PENDING' AND "postId" IS NOT NULL
)
UPDATE "report"
SET
  "status" = 'REJECTED',
  "adminNote" = 'Closed automatically while removing duplicate pending reports.',
  "tackledAt" = NOW()
WHERE "id" IN (
  SELECT "id"
  FROM ranked_reports
  WHERE row_number > 1
);

WITH ranked_reports AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "userId", "commentId"
      ORDER BY "createdAt", "id"
    ) AS row_number
  FROM "report"
  WHERE "status" = 'PENDING' AND "commentId" IS NOT NULL
)
UPDATE "report"
SET
  "status" = 'REJECTED',
  "adminNote" = 'Closed automatically while removing duplicate pending reports.',
  "tackledAt" = NOW()
WHERE "id" IN (
  SELECT "id"
  FROM ranked_reports
  WHERE row_number > 1
);

CREATE UNIQUE INDEX "report_pending_post_user_key"
ON "report"("userId", "postId")
WHERE "status" = 'PENDING' AND "postId" IS NOT NULL;

CREATE UNIQUE INDEX "report_pending_comment_user_key"
ON "report"("userId", "commentId")
WHERE "status" = 'PENDING' AND "commentId" IS NOT NULL;
