/*
  Warnings:

  - You are about to drop the column `message` on the `ChatMessage` table. All the data in the column will be lost.
  - You are about to drop the column `response` on the `ChatMessage` table. All the data in the column will be lost.
  - You are about to drop the column `custom` on the `EngineeringRequirement` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Note` table. All the data in the column will be lost.
  - You are about to drop the column `acreage` on the `Parcel` table. All the data in the column will be lost.
  - You are about to drop the column `jurisdiction` on the `Parcel` table. All the data in the column will be lost.
  - You are about to drop the column `landUse` on the `Parcel` table. All the data in the column will be lost.
  - You are about to drop the column `sqft` on the `Parcel` table. All the data in the column will be lost.
  - You are about to drop the column `zoningCode` on the `Parcel` table. All the data in the column will be lost.
  - The `zoningRules` column on the `Parcel` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `buildingFootprintSqFt` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `hillsideGrade` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `jurisdiction` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `lotSizeSqFt` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `mainContact` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `onSeptic` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `outsideFootprintSf` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `scopeOfWork` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `totalSfModified` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `filename` on the `ProjectFile` table. All the data in the column will be lost.
  - You are about to drop the column `filepath` on the `ProjectFile` table. All the data in the column will be lost.
  - You are about to drop the column `mimeType` on the `ProjectFile` table. All the data in the column will be lost.
  - You are about to drop the column `originalName` on the `ProjectFile` table. All the data in the column will be lost.
  - You are about to drop the column `size` on the `ProjectFile` table. All the data in the column will be lost.
  - You are about to drop the column `uploadedBy` on the `ProjectFile` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Task` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[apn]` on the table `Parcel` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[parcelId]` on the table `Project` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `content` to the `ChatMessage` table without a default value. This is not possible if the table is not empty.
  - Made the column `userId` on table `ChatMessage` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `updatedAt` to the `Membership` table without a default value. This is not possible if the table is not empty.
  - Added the required column `authorId` to the `Note` table without a default value. This is not possible if the table is not empty.
  - Made the column `apn` on table `Parcel` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `ownerId` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fileName` to the `ProjectFile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fileUrl` to the `ProjectFile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `ProjectFile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `uploadedById` to the `ProjectFile` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('HOMEOWNER', 'BUILDER', 'DEVELOPER', 'ARCHITECT', 'ENGINEER', 'REAL_ESTATE', 'OTHER');

-- DropForeignKey
ALTER TABLE "ChatMessage" DROP CONSTRAINT "ChatMessage_userId_fkey";

-- DropForeignKey
ALTER TABLE "Note" DROP CONSTRAINT "Note_userId_fkey";

-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_orgId_fkey";

-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_userId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectFile" DROP CONSTRAINT "ProjectFile_uploadedBy_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_userId_fkey";

-- DropIndex
DROP INDEX "ChatMessage_projectId_createdAt_idx";

-- AlterTable
ALTER TABLE "ChatMessage" DROP COLUMN "message",
DROP COLUMN "response",
ADD COLUMN     "content" TEXT NOT NULL,
ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "EngineeringRequirement" DROP COLUMN "custom";

-- AlterTable
ALTER TABLE "Membership" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Note" DROP COLUMN "userId",
ADD COLUMN     "authorId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Parcel" DROP COLUMN "acreage",
DROP COLUMN "jurisdiction",
DROP COLUMN "landUse",
DROP COLUMN "sqft",
DROP COLUMN "zoningCode",
ADD COLUMN     "boundaryCoordinates" JSONB,
ADD COLUMN     "existingSqFt" DOUBLE PRECISION,
ADD COLUMN     "propertyMetadata" JSONB,
ALTER COLUMN "apn" SET NOT NULL,
ALTER COLUMN "lotSizeSqFt" SET DATA TYPE DOUBLE PRECISION,
DROP COLUMN "zoningRules",
ADD COLUMN     "zoningRules" JSONB;

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "buildingFootprintSqFt",
DROP COLUMN "hillsideGrade",
DROP COLUMN "jurisdiction",
DROP COLUMN "lotSizeSqFt",
DROP COLUMN "mainContact",
DROP COLUMN "onSeptic",
DROP COLUMN "outsideFootprintSf",
DROP COLUMN "scopeOfWork",
DROP COLUMN "totalSfModified",
DROP COLUMN "userId",
ADD COLUMN     "ownerId" TEXT NOT NULL,
ALTER COLUMN "orgId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ProjectFile" DROP COLUMN "filename",
DROP COLUMN "filepath",
DROP COLUMN "mimeType",
DROP COLUMN "originalName",
DROP COLUMN "size",
DROP COLUMN "uploadedBy",
ADD COLUMN     "fileName" TEXT NOT NULL,
ADD COLUMN     "fileSize" INTEGER,
ADD COLUMN     "fileType" TEXT,
ADD COLUMN     "fileUrl" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "uploadedById" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "userId",
ADD COLUMN     "assignedToId" TEXT,
ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "challenges" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "companyName" TEXT,
ADD COLUMN     "licenseNumber" TEXT,
ADD COLUMN     "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "password" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "projectTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "role" "UserRole",
ADD COLUMN     "serviceArea" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Parcel_apn_key" ON "Parcel"("apn");

-- CreateIndex
CREATE UNIQUE INDEX "Project_parcelId_key" ON "Project"("parcelId");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectFile" ADD CONSTRAINT "ProjectFile_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
