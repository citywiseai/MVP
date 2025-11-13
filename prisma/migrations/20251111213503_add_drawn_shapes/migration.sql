-- CreateTable
CREATE TABLE "DrawnShape" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shapeType" TEXT NOT NULL,
    "coordinates" JSONB NOT NULL,
    "area" DOUBLE PRECISION NOT NULL,
    "perimeter" DOUBLE PRECISION NOT NULL,
    "properties" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DrawnShape_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DrawnShape_projectId_idx" ON "DrawnShape"("projectId");

-- AddForeignKey
ALTER TABLE "DrawnShape" ADD CONSTRAINT "DrawnShape_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
