CREATE TEMP TABLE "amenity_merge_map" AS
SELECT
  "id" AS duplicate_id,
  MIN("id") OVER (
    PARTITION BY LOWER(TRIM("name"))
  ) AS canonical_id
FROM "amenity";

INSERT INTO "post_amenity" ("postId", "amenityId", "currentCondition")
SELECT
  post_amenity."postId",
  amenity_merge_map.canonical_id,
  post_amenity."currentCondition"
FROM "post_amenity"
JOIN "amenity_merge_map"
  ON amenity_merge_map.duplicate_id = post_amenity."amenityId"
WHERE amenity_merge_map.duplicate_id <> amenity_merge_map.canonical_id
ON CONFLICT ("postId", "amenityId") DO NOTHING;

INSERT INTO "demand_amenity" ("studentId", "amenityId")
SELECT
  demand_amenity."studentId",
  amenity_merge_map.canonical_id
FROM "demand_amenity"
JOIN "amenity_merge_map"
  ON amenity_merge_map.duplicate_id = demand_amenity."amenityId"
WHERE amenity_merge_map.duplicate_id <> amenity_merge_map.canonical_id
ON CONFLICT ("studentId", "amenityId") DO NOTHING;

DELETE FROM "post_amenity"
USING "amenity_merge_map"
WHERE
  "post_amenity"."amenityId" = amenity_merge_map.duplicate_id
  AND amenity_merge_map.duplicate_id <> amenity_merge_map.canonical_id;

DELETE FROM "demand_amenity"
USING "amenity_merge_map"
WHERE
  "demand_amenity"."amenityId" = amenity_merge_map.duplicate_id
  AND amenity_merge_map.duplicate_id <> amenity_merge_map.canonical_id;

DELETE FROM "amenity"
USING "amenity_merge_map"
WHERE
  "amenity"."id" = amenity_merge_map.duplicate_id
  AND amenity_merge_map.duplicate_id <> amenity_merge_map.canonical_id;

UPDATE "amenity"
SET "name" = TRIM("name");

CREATE UNIQUE INDEX "amenity_name_key" ON "amenity"("name");
