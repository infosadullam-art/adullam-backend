-- AlterTable
ALTER TABLE "Interaction" ADD COLUMN     "country" TEXT;

-- CreateIndex
CREATE INDEX "Interaction_country_idx" ON "Interaction"("country");
