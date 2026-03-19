/*
  Warnings:

  - A unique constraint covering the columns `[userId,productId,variantId,version]` on the table `FeedScore` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,productId,variantId,version]` on the table `ForYouScore` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `RawVariant` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "EdgeType" ADD VALUE 'HAS_VARIANT';

-- AlterEnum
ALTER TYPE "NodeType" ADD VALUE 'VARIANT';

-- DropIndex
DROP INDEX "FeedScore_userId_productId_version_key";

-- DropIndex
DROP INDEX "ForYouScore_userId_productId_version_key";

-- AlterTable
ALTER TABLE "AdsEvent" ADD COLUMN     "variantId" TEXT;

-- AlterTable
ALTER TABLE "CleanProduct" ADD COLUMN     "weight" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "FeedScore" ADD COLUMN     "variantId" TEXT;

-- AlterTable
ALTER TABLE "ForYouScore" ADD COLUMN     "variantId" TEXT;

-- AlterTable
ALTER TABLE "Interaction" ADD COLUMN     "variantId" TEXT;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "variantId" TEXT;

-- AlterTable
ALTER TABLE "RawProduct" ADD COLUMN     "weight" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "RawVariant" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "weight" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "CleanVariant" (
    "id" TEXT NOT NULL,
    "cleanProductId" TEXT NOT NULL,
    "externalSkuId" TEXT NOT NULL,
    "name" TEXT,
    "price" DOUBLE PRECISION,
    "currency" TEXT DEFAULT 'USD',
    "stock" INTEGER,
    "weight" DOUBLE PRECISION,
    "attributes" JSONB,
    "image" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CleanVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductVariant" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "stock" INTEGER NOT NULL DEFAULT 0,
    "weight" DOUBLE PRECISION,
    "attributes" JSONB,
    "image" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CleanVariant_externalSkuId_idx" ON "CleanVariant"("externalSkuId");

-- CreateIndex
CREATE UNIQUE INDEX "CleanVariant_cleanProductId_externalSkuId_key" ON "CleanVariant"("cleanProductId", "externalSkuId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_sku_key" ON "ProductVariant"("sku");

-- CreateIndex
CREATE INDEX "ProductVariant_productId_idx" ON "ProductVariant"("productId");

-- CreateIndex
CREATE INDEX "ProductVariant_sku_idx" ON "ProductVariant"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_productId_sku_key" ON "ProductVariant"("productId", "sku");

-- CreateIndex
CREATE INDEX "AdsEvent_variantId_idx" ON "AdsEvent"("variantId");

-- CreateIndex
CREATE UNIQUE INDEX "FeedScore_userId_productId_variantId_version_key" ON "FeedScore"("userId", "productId", "variantId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "ForYouScore_userId_productId_variantId_version_key" ON "ForYouScore"("userId", "productId", "variantId", "version");

-- CreateIndex
CREATE INDEX "Interaction_variantId_idx" ON "Interaction"("variantId");

-- CreateIndex
CREATE INDEX "OrderItem_variantId_idx" ON "OrderItem"("variantId");

-- AddForeignKey
ALTER TABLE "CleanVariant" ADD CONSTRAINT "CleanVariant_cleanProductId_fkey" FOREIGN KEY ("cleanProductId") REFERENCES "CleanProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
