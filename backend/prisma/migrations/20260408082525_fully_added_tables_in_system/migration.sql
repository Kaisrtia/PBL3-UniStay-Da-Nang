/*
  Warnings:

  - You are about to alter the column `hashedPassword` on the `user` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.

*/
-- CreateEnum
CREATE TYPE "post_status" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'UPDATED', 'HIDDEN');

-- CreateEnum
CREATE TYPE "post_purpose" AS ENUM ('RENT', 'FIND_ROOMMATE');

-- CreateEnum
CREATE TYPE "room_type" AS ENUM ('ROOM', 'APARTMENT', 'HOUSE');

-- CreateEnum
CREATE TYPE "accomodation_request_status" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'HIDDEN');

-- CreateEnum
CREATE TYPE "comment_status" AS ENUM ('DISPLAYED', 'HIDDEN');

-- CreateEnum
CREATE TYPE "report_status" AS ENUM ('PENDING', 'RESOLVED', 'REJECTED', 'HIDDEN');

-- CreateEnum
CREATE TYPE "amenity_condition" AS ENUM ('NEW', 'GOOD', 'OLD');

-- CreateEnum
CREATE TYPE "notification_type" AS ENUM ('POST', 'COMMENT', 'ACCOMODATION_REQUEST', 'REPORT', 'SYSTEM');

-- AlterEnum
ALTER TYPE "account_status" ADD VALUE 'HIDDEN';

-- AlterTable
ALTER TABLE "user" ALTER COLUMN "hashedPassword" SET DATA TYPE VARCHAR(255);

-- CreateTable
CREATE TABLE "district" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,

    CONSTRAINT "district_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ward" (
    "id" SERIAL NOT NULL,
    "districtId" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,

    CONSTRAINT "ward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "university" (
    "id" VARCHAR(10) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "wardId" INTEGER NOT NULL,
    "streetName" VARCHAR(255) NOT NULL,
    "houseNumber" VARCHAR(50) NOT NULL,

    CONSTRAINT "university_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student" (
    "studentId" TEXT NOT NULL,
    "totalPost" INTEGER NOT NULL DEFAULT 0,
    "universityId" TEXT,

    CONSTRAINT "student_pkey" PRIMARY KEY ("studentId")
);

-- CreateTable
CREATE TABLE "host" (
    "hostId" TEXT NOT NULL,
    "totalPost" INTEGER NOT NULL DEFAULT 0,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "avgStar" DECIMAL(3,2) NOT NULL DEFAULT -1,

    CONSTRAINT "host_pkey" PRIMARY KEY ("hostId")
);

-- CreateTable
CREATE TABLE "student_evaluate_host" (
    "id" SERIAL NOT NULL,
    "studentId" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "numberStar" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_evaluate_host_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_feedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "numberStar" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comment" (
    "id" VARCHAR(30) NOT NULL,
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "parentId" TEXT,
    "content" TEXT NOT NULL,
    "status" "comment_status" NOT NULL DEFAULT 'DISPLAYED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post" (
    "id" VARCHAR(30) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "userId" TEXT NOT NULL,
    "wardId" INTEGER NOT NULL,
    "purpose" VARCHAR(50) NOT NULL,
    "detailAddress" TEXT NOT NULL,
    "area" DECIMAL(10,2) NOT NULL,
    "price" DECIMAL(15,2) NOT NULL,
    "deposit" DECIMAL(15,2) NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "roomType" "room_type" NOT NULL DEFAULT 'ROOM',
    "postPurpose" "post_purpose" NOT NULL DEFAULT 'RENT',
    "description" TEXT NOT NULL,
    "latitude" DECIMAL(9,6) NOT NULL,
    "longitude" DECIMAL(9,6) NOT NULL,
    "status" "post_status" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_image" (
    "id" SERIAL NOT NULL,
    "postId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,

    CONSTRAINT "post_image_pkey" PRIMARY KEY ("id","postId")
);

-- CreateTable
CREATE TABLE "amenity" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,

    CONSTRAINT "amenity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_amenity" (
    "id" SERIAL NOT NULL,
    "postId" TEXT NOT NULL,
    "amenityId" INTEGER NOT NULL,
    "currentCondition" "amenity_condition" NOT NULL DEFAULT 'GOOD',

    CONSTRAINT "post_amenity_pkey" PRIMARY KEY ("id","postId")
);

-- CreateTable
CREATE TABLE "student_demand" (
    "studentId" TEXT NOT NULL,
    "wardId" INTEGER NOT NULL,
    "universityId" TEXT,
    "minPrice" DECIMAL(15,2) NOT NULL,
    "maxPrice" DECIMAL(15,2) NOT NULL,
    "roomType" "room_type" NOT NULL,
    "isLookingForRoommate" BOOLEAN NOT NULL DEFAULT false,
    "roommateGender" VARCHAR(10) NOT NULL,
    "rommateCriteria" TEXT NOT NULL,

    CONSTRAINT "student_demand_pkey" PRIMARY KEY ("studentId")
);

-- CreateTable
CREATE TABLE "demand_amenity" (
    "studentId" TEXT NOT NULL,
    "amenityId" INTEGER NOT NULL,

    CONSTRAINT "demand_amenity_pkey" PRIMARY KEY ("studentId","amenityId")
);

-- CreateTable
CREATE TABLE "student_favorite_post" (
    "studentId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,

    CONSTRAINT "student_favorite_post_pkey" PRIMARY KEY ("studentId","postId")
);

-- CreateTable
CREATE TABLE "accomodation_request" (
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "accomodation_request_status" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "accomodation_request_pkey" PRIMARY KEY ("postId","userId")
);

-- CreateTable
CREATE TABLE "report" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "adminId" TEXT,
    "postId" TEXT,
    "commentId" TEXT,
    "reason" TEXT NOT NULL,
    "status" "report_status" NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tackledAt" TIMESTAMP(3),

    CONSTRAINT "report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "type" "notification_type" NOT NULL DEFAULT 'POST',
    "metaData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "post_image_id_key" ON "post_image"("id");

-- CreateIndex
CREATE UNIQUE INDEX "post_amenity_id_key" ON "post_amenity"("id");

-- AddForeignKey
ALTER TABLE "ward" ADD CONSTRAINT "ward_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "district"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "university" ADD CONSTRAINT "university_wardId_fkey" FOREIGN KEY ("wardId") REFERENCES "ward"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student" ADD CONSTRAINT "student_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "university"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student" ADD CONSTRAINT "student_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "host" ADD CONSTRAINT "host_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_evaluate_host" ADD CONSTRAINT "student_evaluate_host_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student"("studentId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_evaluate_host" ADD CONSTRAINT "student_evaluate_host_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "host"("hostId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_feedback" ADD CONSTRAINT "system_feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment" ADD CONSTRAINT "comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment" ADD CONSTRAINT "comment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment" ADD CONSTRAINT "comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post" ADD CONSTRAINT "post_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post" ADD CONSTRAINT "post_wardId_fkey" FOREIGN KEY ("wardId") REFERENCES "ward"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_image" ADD CONSTRAINT "post_image_postId_fkey" FOREIGN KEY ("postId") REFERENCES "post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_amenity" ADD CONSTRAINT "post_amenity_postId_fkey" FOREIGN KEY ("postId") REFERENCES "post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_amenity" ADD CONSTRAINT "post_amenity_amenityId_fkey" FOREIGN KEY ("amenityId") REFERENCES "amenity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_demand" ADD CONSTRAINT "student_demand_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student"("studentId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_demand" ADD CONSTRAINT "student_demand_wardId_fkey" FOREIGN KEY ("wardId") REFERENCES "ward"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_demand" ADD CONSTRAINT "student_demand_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "university"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demand_amenity" ADD CONSTRAINT "demand_amenity_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student"("studentId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demand_amenity" ADD CONSTRAINT "demand_amenity_amenityId_fkey" FOREIGN KEY ("amenityId") REFERENCES "amenity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_favorite_post" ADD CONSTRAINT "student_favorite_post_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student"("studentId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_favorite_post" ADD CONSTRAINT "student_favorite_post_postId_fkey" FOREIGN KEY ("postId") REFERENCES "post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accomodation_request" ADD CONSTRAINT "accomodation_request_postId_fkey" FOREIGN KEY ("postId") REFERENCES "post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accomodation_request" ADD CONSTRAINT "accomodation_request_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report" ADD CONSTRAINT "report_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report" ADD CONSTRAINT "report_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report" ADD CONSTRAINT "report_postId_fkey" FOREIGN KEY ("postId") REFERENCES "post"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report" ADD CONSTRAINT "report_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
