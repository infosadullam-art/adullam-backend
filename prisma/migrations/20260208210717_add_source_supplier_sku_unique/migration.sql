/*
  Warnings:

  - You are about to drop the column `dataSourceType` on the `RawProduct` table. All the data in the column will be lost.
  - You are about to drop the column `errorMessage` on the `RawProduct` table. All the data in the column will be lost.
  - You are about to drop the column `externalSkuId` on the `RawProduct` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `RawProduct` table. All the data in the column will be lost.
  - You are about to drop the column `externalSkuId` on the `RawVariant` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[source,supplierSku]` on the table `RawProduct` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[rawProductId,supplierSku]` on the table `RawVariant` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `supplierSku` to the `RawVariant` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PipelineStage" AS ENUM ('SEARCHED', 'ENRICHED', 'READY_FOR_CLEAN', 'CLEANED', 'PUBLISHED', 'REJECTED');

-- DropIndex
DROP INDEX "RawProduct_externalProductId_idx";

-- DropIndex
DROP INDEX "RawProduct_importBatchId_idx";

-- DropIndex
DROP INDEX "RawProduct_isDuplicate_idx";

-- DropIndex
DROP INDEX "RawProduct_isFake_idx";

-- DropIndex
DROP INDEX "RawProduct_source_externalProductId_key";

-- DropIndex
DROP INDEX "RawProduct_source_idx";

-- DropIndex
DROP INDEX "RawProduct_status_idx";

-- DropIndex
DROP INDEX "RawVariant_externalSkuId_idx";

-- DropIndex
DROP INDEX "RawVariant_rawProductId_externalSkuId_key";

-- AlterTable
ALTER TABLE "RawProduct" DROP COLUMN "dataSourceType",
DROP COLUMN "errorMessage",
DROP COLUMN "externalSkuId",
DROP COLUMN "status",
ADD COLUMN     "pipelineStage" "PipelineStage" NOT NULL DEFAULT 'SEARCHED',
ADD COLUMN     "rejectReason" TEXT,
ADD COLUMN     "searchFetchedAt" TIMESTAMP(3),
ADD COLUMN     "skuFetchedAt" TIMESTAMP(3),
ADD COLUMN     "supplierSku" TEXT NOT NULL DEFAULT 'TEMP';

-- AlterTable
ALTER TABLE "RawVariant" DROP COLUMN "externalSkuId",
ADD COLUMN     "supplierSku" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "RawProduct_pipelineStage_idx" ON "RawProduct"("pipelineStage");

-- CreateIndex
CREATE UNIQUE INDEX "RawProduct_source_supplierSku_key" ON "RawProduct"("source", "supplierSku");

-- CreateIndex
CREATE INDEX "RawVariant_supplierSku_idx" ON "RawVariant"("supplierSku");

-- CreateIndex
CREATE UNIQUE INDEX "RawVariant_rawProductId_supplierSku_key" ON "RawVariant"("rawProductId", "supplierSku");
