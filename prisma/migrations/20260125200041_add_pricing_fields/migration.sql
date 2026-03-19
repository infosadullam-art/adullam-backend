/*
  Warnings:

  - You are about to drop the column `compareAtPrice` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `costPrice` on the `Product` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Product" DROP COLUMN "compareAtPrice",
DROP COLUMN "costPrice",
ADD COLUMN     "grossProfitUSD" DOUBLE PRECISION,
ADD COLUMN     "marginPercent" DOUBLE PRECISION,
ADD COLUMN     "sellingPriceUSD" DOUBLE PRECISION,
ADD COLUMN     "supplierPriceUSD" DOUBLE PRECISION,
ALTER COLUMN "currency" SET DEFAULT 'USD';
