/*
  Warnings:

  - The primary key for the `post_amenity` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `post_amenity` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "post_amenity_id_key";

-- AlterTable
ALTER TABLE "post_amenity" DROP CONSTRAINT "post_amenity_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "post_amenity_pkey" PRIMARY KEY ("postId", "amenityId");
