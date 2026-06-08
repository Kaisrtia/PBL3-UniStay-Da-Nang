WITH ranked_notifications AS (
  SELECT
    "id",
    'censor-post:' || "userId" || ':' || ("metaData" ->> 'postId') AS dedupe_key,
    ROW_NUMBER() OVER (
      PARTITION BY "userId", "metaData" ->> 'postId'
      ORDER BY COALESCE("updatedAt", "createdAt") DESC, "id" DESC
    ) AS row_number
  FROM "notification"
  WHERE
    "dedupeKey" IS NULL
    AND "type" = 'CENSOR_POST'
    AND "metaData" ->> 'postId' IS NOT NULL
)
UPDATE "notification" AS notification
SET "dedupeKey" = ranked_notifications.dedupe_key
FROM ranked_notifications
WHERE
  notification."id" = ranked_notifications."id"
  AND ranked_notifications.row_number = 1
  AND NOT EXISTS (
    SELECT 1
    FROM "notification" AS existing
    WHERE existing."dedupeKey" = ranked_notifications.dedupe_key
  );

WITH ranked_notifications AS (
  SELECT
    "id",
    'accommodation-request:' || "userId" || ':' || ("metaData" ->> 'postId') AS dedupe_key,
    ROW_NUMBER() OVER (
      PARTITION BY "userId", "metaData" ->> 'postId'
      ORDER BY COALESCE("updatedAt", "createdAt") DESC, "id" DESC
    ) AS row_number
  FROM "notification"
  WHERE
    "dedupeKey" IS NULL
    AND "type" = 'ACCOMODATION_REQUEST'
    AND "metaData" ->> 'postId' IS NOT NULL
)
UPDATE "notification" AS notification
SET "dedupeKey" = ranked_notifications.dedupe_key
FROM ranked_notifications
WHERE
  notification."id" = ranked_notifications."id"
  AND ranked_notifications.row_number = 1
  AND NOT EXISTS (
    SELECT 1
    FROM "notification" AS existing
    WHERE existing."dedupeKey" = ranked_notifications.dedupe_key
  );

WITH ranked_notifications AS (
  SELECT
    "id",
    CASE
      WHEN "metaData" ->> 'notificationLevel' = 'REPLY'
        THEN 'comment-reply:' || "userId" || ':' || ("metaData" ->> 'parentId')
      ELSE 'comment-root:' || "userId" || ':' || ("metaData" ->> 'postId')
    END AS dedupe_key,
    ROW_NUMBER() OVER (
      PARTITION BY
        "userId",
        COALESCE("metaData" ->> 'notificationLevel', 'ROOT'),
        CASE
          WHEN "metaData" ->> 'notificationLevel' = 'REPLY'
            THEN "metaData" ->> 'parentId'
          ELSE "metaData" ->> 'postId'
        END
      ORDER BY COALESCE("updatedAt", "createdAt") DESC, "id" DESC
    ) AS row_number
  FROM "notification"
  WHERE
    "dedupeKey" IS NULL
    AND "type" = 'COMMENT'
    AND (
      (
        "metaData" ->> 'notificationLevel' = 'REPLY'
        AND "metaData" ->> 'parentId' IS NOT NULL
      )
      OR (
        COALESCE("metaData" ->> 'notificationLevel', 'ROOT') = 'ROOT'
        AND "metaData" ->> 'postId' IS NOT NULL
      )
    )
)
UPDATE "notification" AS notification
SET "dedupeKey" = ranked_notifications.dedupe_key
FROM ranked_notifications
WHERE
  notification."id" = ranked_notifications."id"
  AND ranked_notifications.row_number = 1
  AND NOT EXISTS (
    SELECT 1
    FROM "notification" AS existing
    WHERE existing."dedupeKey" = ranked_notifications.dedupe_key
  );

WITH ranked_notifications AS (
  SELECT
    "id",
    'match-demand:' || "userId" || ':' || ("metaData" ->> 'postId') AS dedupe_key,
    ROW_NUMBER() OVER (
      PARTITION BY "userId", "metaData" ->> 'postId'
      ORDER BY COALESCE("updatedAt", "createdAt") DESC, "id" DESC
    ) AS row_number
  FROM "notification"
  WHERE
    "dedupeKey" IS NULL
    AND "type" = 'SYSTEM'
    AND "metaData" ->> 'postId' IS NOT NULL
    AND "metaData" ? 'score'
)
UPDATE "notification" AS notification
SET "dedupeKey" = ranked_notifications.dedupe_key
FROM ranked_notifications
WHERE
  notification."id" = ranked_notifications."id"
  AND ranked_notifications.row_number = 1
  AND NOT EXISTS (
    SELECT 1
    FROM "notification" AS existing
    WHERE existing."dedupeKey" = ranked_notifications.dedupe_key
  );
