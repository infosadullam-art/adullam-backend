-- AlterTable
ALTER TABLE "CleanProduct" ADD COLUMN     "transformerVersion" TEXT;

-- AlterTable
ALTER TABLE "CleanVariant" ADD COLUMN     "variantType" TEXT;

-- AlterTable
ALTER TABLE "ProductVariant" ADD COLUMN     "variantType" TEXT;

-- CreateTable
CREATE TABLE "PriceTier" (
    "id" TEXT NOT NULL,
    "cleanProductId" TEXT,
    "productId" TEXT,
    "minQuantity" INTEGER NOT NULL,
    "maxQuantity" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriceTier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PriceTier_cleanProductId_idx" ON "PriceTier"("cleanProductId");

-- CreateIndex
CREATE INDEX "PriceTier_productId_idx" ON "PriceTier"("productId");

-- CreateIndex
CREATE INDEX "PriceTier_minQuantity_idx" ON "PriceTier"("minQuantity");

-- CreateIndex
CREATE UNIQUE INDEX "PriceTier_cleanProductId_minQuantity_maxQuantity_key" ON "PriceTier"("cleanProductId", "minQuantity", "maxQuantity");

-- CreateIndex
CREATE UNIQUE INDEX "PriceTier_productId_minQuantity_maxQuantity_key" ON "PriceTier"("productId", "minQuantity", "maxQuantity");

-- AddForeignKey
ALTER TABLE "PriceTier" ADD CONSTRAINT "PriceTier_cleanProductId_fkey" FOREIGN KEY ("cleanProductId") REFERENCES "CleanProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceTier" ADD CONSTRAINT "PriceTier_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
