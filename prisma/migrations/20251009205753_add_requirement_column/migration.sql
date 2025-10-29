/*
  Warnings:

  - You are about to drop the column `status` on the `EngineeringRequirement` table. All the data in the column will be lost.
  - You are about to drop the column `authorId` on the `Note` table. All the data in the column will be lost.
  - You are about to drop the column `fileSize` on the `ProjectFile` table. All the data in the column will be lost.
  - You are about to drop the column `createdById` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the `ZoningRule` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_UserProjects` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `requirement` to the `EngineeringRequirement` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mimeType` to the `ProjectFile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `originalName` to the `ProjectFile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `size` to the `ProjectFile` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Note" DROP CONSTRAINT "Note_authorId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Task" DROP CONSTRAINT "Task_createdById_fkey";

-- DropForeignKey
ALTER TABLE "public"."ZoningRule" DROP CONSTRAINT "ZoningRule_parcelId_fkey";

-- DropForeignKey
ALTER TABLE "public"."_UserProjects" DROP CONSTRAINT "_UserProjects_A_fkey";

-- DropForeignKey
ALTER TABLE "public"."_UserProjects" DROP CONSTRAINT "_UserProjects_B_fkey";

-- DropIndex
DROP INDEX "public"."Parcel_apn_jurisdiction_key";

-- AlterTable
ALTER TABLE "EngineeringRequirement" DROP COLUMN "status",
ADD COLUMN     "custom" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "requirement" TEXT NOT NULL,
ALTER COLUMN "discipline" DROP NOT NULL,
ALTER COLUMN "required" SET DEFAULT false;

-- AlterTable
ALTER TABLE "Note" DROP COLUMN "authorId",
ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "Parcel" ADD COLUMN     "acreage" DOUBLE PRECISION,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "county" TEXT,
ADD COLUMN     "landUse" TEXT,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "sqft" INTEGER,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "zipCode" TEXT,
ADD COLUMN     "zoning" TEXT,
ADD COLUMN     "zoningRules" JSONB[] DEFAULT ARRAY[]::JSONB[],
ALTER COLUMN "apn" DROP NOT NULL,
ALTER COLUMN "address" DROP NOT NULL,
ALTER COLUMN "jurisdiction" DROP NOT NULL,
ALTER COLUMN "zoningCode" DROP NOT NULL,
ALTER COLUMN "lotSizeSqFt" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ProjectFile" DROP COLUMN "fileSize",
ADD COLUMN     "mimeType" TEXT NOT NULL,
ADD COLUMN     "originalName" TEXT NOT NULL,
ADD COLUMN     "size" INTEGER NOT NULL,
ADD COLUMN     "uploadedBy" TEXT,
ALTER COLUMN "filepath" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "createdById",
ADD COLUMN     "userId" TEXT;

-- DropTable
DROP TABLE "public"."ZoningRule";

-- DropTable
DROP TABLE "public"."_UserProjects";

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChatMessage_projectId_createdAt_idx" ON "ChatMessage"("projectId", "createdAt");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectFile" ADD CONSTRAINT "ProjectFile_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
