/*
  Warnings:

  - You are about to drop the column `pipelineStage` on the `RawProduct` table. All the data in the column will be lost.
  - You are about to drop the column `rejectReason` on the `RawProduct` table. All the data in the column will be lost.
  - You are about to drop the column `searchFetchedAt` on the `RawProduct` table. All the data in the column will be lost.
  - You are about to drop the column `skuFetchedAt` on the `RawProduct` table. All the data in the column will be lost.
  - You are about to drop the column `supplierSku` on the `RawVariant` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[source,externalProductId]` on the table `RawProduct` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[rawProductId,externalSkuId]` on the table `RawVariant` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `externalSkuId` to the `RawVariant` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "RawProduct_pipelineStage_idx";

-- DropIndex
DROP INDEX "RawVariant_rawProductId_supplierSku_key";

-- DropIndex
DROP INDEX "RawVariant_supplierSku_idx";

-- AlterTable
ALTER TABLE "RawProduct" DROP COLUMN "pipelineStage",
DROP COLUMN "rejectReason",
DROP COLUMN "searchFetchedAt",
DROP COLUMN "skuFetchedAt",
ADD COLUMN     "dataSourceType" TEXT NOT NULL DEFAULT 'ALIEXPRESS_API',
ADD COLUMN     "errorMessage" TEXT,
ADD COLUMN     "externalSkuId" TEXT,
ADD COLUMN     "status" "ImportStatus" NOT NULL DEFAULT 'PENDING',
ALTER COLUMN "supplierSku" DROP DEFAULT;

-- AlterTable
ALTER TABLE "RawVariant" DROP COLUMN "supplierSku",
ADD COLUMN     "externalSkuId" TEXT NOT NULL;

-- DropEnum
DROP TYPE "PipelineStage";

-- CreateIndex
CREATE INDEX "RawProduct_externalProductId_idx" ON "RawProduct"("externalProductId");

-- CreateIndex
CREATE INDEX "RawProduct_importBatchId_idx" ON "RawProduct"("importBatchId");

-- CreateIndex
CREATE INDEX "RawProduct_isDuplicate_idx" ON "RawProduct"("isDuplicate");

-- CreateIndex
CREATE INDEX "RawProduct_isFake_idx" ON "RawProduct"("isFake");

-- CreateIndex
CREATE INDEX "RawProduct_source_idx" ON "RawProduct"("source");

-- CreateIndex
CREATE INDEX "RawProduct_status_idx" ON "RawProduct"("status");

-- CreateIndex
CREATE UNIQUE INDEX "RawProduct_source_externalProductId_key" ON "RawProduct"("source", "externalProductId");

-- CreateIndex
CREATE INDEX "RawVariant_externalSkuId_idx" ON "RawVariant"("externalSkuId");

-- CreateIndex
CREATE UNIQUE INDEX "RawVariant_rawProductId_externalSkuId_key" ON "RawVariant"("rawProductId", "externalSkuId");
