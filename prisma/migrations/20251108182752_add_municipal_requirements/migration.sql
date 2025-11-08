/*
  Warnings:

  - You are about to drop the column `requirement` on the `EngineeringRequirement` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Membership` table. All the data in the column will be lost.
  - You are about to drop the column `slug` on the `Org` table. All the data in the column will be lost.
  - You are about to drop the column `fileSize` on the `ProjectFile` table. All the data in the column will be lost.
  - You are about to drop the column `uploadedById` on the `ProjectFile` table. All the data in the column will be lost.
  - You are about to drop the column `assignedToId` on the `Task` table. All the data in the column will be lost.
  - Made the column `discipline` on table `EngineeringRequirement` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `uploadedBy` to the `ProjectFile` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "RequirementType" AS ENUM ('PERMIT', 'ENGINEERING', 'REVIEW', 'INSPECTION', 'STUDY');

-- CreateEnum
CREATE TYPE "ProjectType" AS ENUM ('ADDITION', 'REMODEL', 'ADU', 'NEW_CONSTRUCTION', 'DEMOLITION', 'GARAGE_CONVERSION', 'PATIO_COVER', 'FENCE', 'POOL', 'SOLAR');

-- CreateEnum
CREATE TYPE "TriggerOperator" AS ENUM ('GREATER_THAN', 'GREATER_THAN_OR_EQUAL', 'LESS_THAN', 'LESS_THAN_OR_EQUAL', 'EQUALS', 'NOT_EQUALS', 'INCLUDES', 'EXISTS');

-- DropForeignKey
ALTER TABLE "ChatMessage" DROP CONSTRAINT "ChatMessage_userId_fkey";

-- DropForeignKey
ALTER TABLE "Note" DROP CONSTRAINT "Note_authorId_fkey";

-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_orgId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectFile" DROP CONSTRAINT "ProjectFile_uploadedById_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_assignedToId_fkey";

-- DropIndex
DROP INDEX "Org_slug_key";

-- AlterTable
ALTER TABLE "EngineeringRequirement" DROP COLUMN "requirement",
ALTER COLUMN "discipline" SET NOT NULL,
ALTER COLUMN "required" SET DEFAULT true;

-- AlterTable
ALTER TABLE "Membership" DROP COLUMN "updatedAt",
ALTER COLUMN "role" SET DEFAULT 'member';

-- AlterTable
ALTER TABLE "Org" DROP COLUMN "slug";

-- AlterTable
ALTER TABLE "ProjectFile" DROP COLUMN "fileSize",
DROP COLUMN "uploadedById",
ADD COLUMN     "uploadedBy" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "assignedToId",
ADD COLUMN     "assignedTo" TEXT;

-- CreateTable
CREATE TABLE "Jurisdiction" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'Arizona',
    "phone" TEXT,
    "website" TEXT,
    "permitPortalUrl" TEXT,
    "typicalReviewDays" INTEGER,
    "expressPermitDays" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Jurisdiction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ZoningCode" (
    "id" TEXT NOT NULL,
    "jurisdictionId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "frontSetback" DOUBLE PRECISION,
    "rearSetback" DOUBLE PRECISION,
    "sideSetback" DOUBLE PRECISION,
    "maxLotCoverage" DOUBLE PRECISION,
    "maxHeight" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ZoningCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MunicipalRequirement" (
    "id" TEXT NOT NULL,
    "jurisdictionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "RequirementType" NOT NULL,
    "category" TEXT,
    "description" TEXT NOT NULL,
    "typicalCostRange" TEXT,
    "typicalTimeframe" TEXT,
    "providedBy" TEXT,
    "appliesToProjectTypes" "ProjectType"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MunicipalRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequirementRule" (
    "id" TEXT NOT NULL,
    "jurisdictionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "projectTypes" "ProjectType"[],
    "requirementId" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sourceDocument" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RequirementRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RuleTrigger" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "operator" "TriggerOperator" NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RuleTrigger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_RequirementRuleToZoningCode" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_RequirementRuleToZoningCode_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Jurisdiction_name_key" ON "Jurisdiction"("name");

-- CreateIndex
CREATE INDEX "Jurisdiction_name_idx" ON "Jurisdiction"("name");

-- CreateIndex
CREATE INDEX "ZoningCode_jurisdictionId_idx" ON "ZoningCode"("jurisdictionId");

-- CreateIndex
CREATE INDEX "ZoningCode_code_idx" ON "ZoningCode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ZoningCode_jurisdictionId_code_key" ON "ZoningCode"("jurisdictionId", "code");

-- CreateIndex
CREATE INDEX "MunicipalRequirement_jurisdictionId_idx" ON "MunicipalRequirement"("jurisdictionId");

-- CreateIndex
CREATE INDEX "MunicipalRequirement_type_idx" ON "MunicipalRequirement"("type");

-- CreateIndex
CREATE UNIQUE INDEX "MunicipalRequirement_jurisdictionId_name_key" ON "MunicipalRequirement"("jurisdictionId", "name");

-- CreateIndex
CREATE INDEX "RequirementRule_jurisdictionId_idx" ON "RequirementRule"("jurisdictionId");

-- CreateIndex
CREATE INDEX "RequirementRule_requirementId_idx" ON "RequirementRule"("requirementId");

-- CreateIndex
CREATE INDEX "RuleTrigger_ruleId_idx" ON "RuleTrigger"("ruleId");

-- CreateIndex
CREATE INDEX "_RequirementRuleToZoningCode_B_index" ON "_RequirementRuleToZoningCode"("B");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectFile" ADD CONSTRAINT "ProjectFile_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ZoningCode" ADD CONSTRAINT "ZoningCode_jurisdictionId_fkey" FOREIGN KEY ("jurisdictionId") REFERENCES "Jurisdiction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MunicipalRequirement" ADD CONSTRAINT "MunicipalRequirement_jurisdictionId_fkey" FOREIGN KEY ("jurisdictionId") REFERENCES "Jurisdiction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequirementRule" ADD CONSTRAINT "RequirementRule_jurisdictionId_fkey" FOREIGN KEY ("jurisdictionId") REFERENCES "Jurisdiction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequirementRule" ADD CONSTRAINT "RequirementRule_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "MunicipalRequirement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleTrigger" ADD CONSTRAINT "RuleTrigger_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "RequirementRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RequirementRuleToZoningCode" ADD CONSTRAINT "_RequirementRuleToZoningCode_A_fkey" FOREIGN KEY ("A") REFERENCES "RequirementRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RequirementRuleToZoningCode" ADD CONSTRAINT "_RequirementRuleToZoningCode_B_fkey" FOREIGN KEY ("B") REFERENCES "ZoningCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
