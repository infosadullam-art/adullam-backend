/*
  Warnings:

  - You are about to drop the column `externalId` on the `RawProduct` table. All the data in the column will be lost.
  - You are about to drop the column `rawPrice` on the `RawProduct` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[source,externalProductId]` on the table `RawProduct` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `externalProductId` to the `RawProduct` table without a default value. This is not possible if the table is not empty.
  - Added the required column `source` to the `RawProduct` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "RawProduct_externalId_idx";

-- AlterTable
ALTER TABLE "CleanProduct" ADD COLUMN     "suggestedMarginPercent" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "RawProduct" DROP COLUMN "externalId",
DROP COLUMN "rawPrice",
ADD COLUMN     "dataSourceType" TEXT NOT NULL DEFAULT 'ALIEXPRESS_API',
ADD COLUMN     "externalProductId" TEXT NOT NULL,
ADD COLUMN     "externalShopId" TEXT,
ADD COLUMN     "externalSkuId" TEXT,
ADD COLUMN     "rawMaxPrice" DOUBLE PRECISION,
ADD COLUMN     "rawMinPrice" DOUBLE PRECISION,
ADD COLUMN     "source" "ImportSource" NOT NULL;

-- CreateTable
CREATE TABLE "ApiUsageLog" (
    "id" TEXT NOT NULL,
    "source" "ImportSource" NOT NULL,
    "endpoint" TEXT NOT NULL,
    "calls" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiUsageLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RawVariant" (
    "id" TEXT NOT NULL,
    "rawProductId" TEXT NOT NULL,
    "externalSkuId" TEXT NOT NULL,
    "price" DOUBLE PRECISION,
    "currency" TEXT,
    "stock" INTEGER,
    "attributes" JSONB,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RawVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RawCategory" (
    "id" TEXT NOT NULL,
    "importBatchId" TEXT NOT NULL,
    "source" "ImportSource" NOT NULL,
    "externalCategoryId" TEXT NOT NULL,
    "parentCategoryId" TEXT,
    "name" TEXT NOT NULL,
    "level" INTEGER DEFAULT 1,
    "path" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RawCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ApiUsageLog_source_idx" ON "ApiUsageLog"("source");

-- CreateIndex
CREATE INDEX "ApiUsageLog_endpoint_idx" ON "ApiUsageLog"("endpoint");

-- CreateIndex
CREATE INDEX "ApiUsageLog_date_idx" ON "ApiUsageLog"("date");

-- CreateIndex
CREATE UNIQUE INDEX "ApiUsageLog_source_endpoint_date_key" ON "ApiUsageLog"("source", "endpoint", "date");

-- CreateIndex
CREATE INDEX "RawVariant_externalSkuId_idx" ON "RawVariant"("externalSkuId");

-- CreateIndex
CREATE UNIQUE INDEX "RawVariant_rawProductId_externalSkuId_key" ON "RawVariant"("rawProductId", "externalSkuId");

-- CreateIndex
CREATE UNIQUE INDEX "RawCategory_externalCategoryId_key" ON "RawCategory"("externalCategoryId");

-- CreateIndex
CREATE INDEX "RawProduct_source_idx" ON "RawProduct"("source");

-- CreateIndex
CREATE INDEX "RawProduct_externalProductId_idx" ON "RawProduct"("externalProductId");

-- CreateIndex
CREATE UNIQUE INDEX "RawProduct_source_externalProductId_key" ON "RawProduct"("source", "externalProductId");

-- AddForeignKey
ALTER TABLE "RawVariant" ADD CONSTRAINT "RawVariant_rawProductId_fkey" FOREIGN KEY ("rawProductId") REFERENCES "RawProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;
