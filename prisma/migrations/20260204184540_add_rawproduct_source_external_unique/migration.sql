/*
  Warnings:

  - A unique constraint covering the columns `[source,externalProductId]` on the table `RawProduct` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "RawProduct_source_externalProductId_key" ON "RawProduct"("source", "externalProductId");
