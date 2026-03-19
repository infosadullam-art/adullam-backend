/*
  Warnings:

  - The primary key for the `_OrderToUser` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[A,B]` on the table `_OrderToUser` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "_OrderToUser" DROP CONSTRAINT "_OrderToUser_AB_pkey";

-- CreateIndex
CREATE UNIQUE INDEX "_OrderToUser_AB_unique" ON "_OrderToUser"("A", "B");

-- RenameForeignKey
ALTER TABLE "GraphNode" RENAME CONSTRAINT "GraphNode_entityId_fkey" TO "graphnode_product_fkey";
