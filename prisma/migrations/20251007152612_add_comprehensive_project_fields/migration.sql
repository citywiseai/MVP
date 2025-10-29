-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "buildingFootprintSqFt" INTEGER,
ADD COLUMN     "fullAddress" TEXT,
ADD COLUMN     "hillsideGrade" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "jurisdiction" TEXT,
ADD COLUMN     "lotSizeSqFt" INTEGER,
ADD COLUMN     "mainContact" TEXT,
ADD COLUMN     "onSeptic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "outsideFootprintSf" INTEGER,
ADD COLUMN     "projectType" TEXT,
ADD COLUMN     "propertyType" TEXT,
ADD COLUMN     "scopeOfWork" TEXT,
ADD COLUMN     "totalSfModified" INTEGER;

-- CreateTable
CREATE TABLE "_UserProjects" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_UserProjects_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_UserProjects_B_index" ON "_UserProjects"("B");

-- AddForeignKey
ALTER TABLE "_UserProjects" ADD CONSTRAINT "_UserProjects_A_fkey" FOREIGN KEY ("A") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserProjects" ADD CONSTRAINT "_UserProjects_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
