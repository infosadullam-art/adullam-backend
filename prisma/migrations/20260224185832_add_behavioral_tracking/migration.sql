/*
  Warnings:

  - A unique constraint covering the columns `[userId,productId,variantId,version,context]` on the table `ForYouScore` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Interaction" DROP CONSTRAINT "Interaction_userId_fkey";

-- DropIndex
DROP INDEX "ForYouScore_userId_productId_variantId_version_key";

-- AlterTable
ALTER TABLE "ForYouScore" ADD COLUMN     "context" TEXT,
ADD COLUMN     "decay" DOUBLE PRECISION DEFAULT 1.0,
ADD COLUMN     "interactionIds" TEXT[];

-- AlterTable
ALTER TABLE "Interaction" ADD COLUMN     "returned" BOOLEAN DEFAULT false,
ADD COLUMN     "scrollDepth" DOUBLE PRECISION,
ADD COLUMN     "viewCount" INTEGER DEFAULT 1,
ALTER COLUMN "userId" DROP NOT NULL,
ALTER COLUMN "duration" SET DATA TYPE DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "genre" TEXT,
    "buyerType" TEXT,
    "country" TEXT,
    "avgBasketUSD" DOUBLE PRECISION,
    "totalSpentUSD" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "firstPurchaseAt" TIMESTAMP(3),
    "lastPurchaseAt" TIMESTAMP(3),
    "preferredCategories" JSONB NOT NULL DEFAULT '[]',
    "preferredTimes" JSONB NOT NULL DEFAULT '[]',
    "avgViewTime" DOUBLE PRECISION,
    "bounceRate" DOUBLE PRECISION,
    "sessionFrequency" DOUBLE PRECISION,
    "engagementScore" DOUBLE PRECISION,
    "purchaseIntent" DOUBLE PRECISION,
    "brandLoyalty" DOUBLE PRECISION,
    "embedding" DOUBLE PRECISION[],
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSession" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT,
    "currentCategory" TEXT,
    "currentKeywords" JSONB NOT NULL DEFAULT '[]',
    "currentPriceRange" JSONB NOT NULL DEFAULT '{}',
    "viewedProducts" JSONB NOT NULL DEFAULT '[]',
    "clickedProducts" JSONB NOT NULL DEFAULT '[]',
    "ignoredProducts" JSONB NOT NULL DEFAULT '[]',
    "avgViewTime" DOUBLE PRECISION,
    "totalViewTime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "productsViewed" INTEGER NOT NULL DEFAULT 0,
    "productsClicked" INTEGER NOT NULL DEFAULT 0,
    "scrollPattern" JSONB NOT NULL DEFAULT '{}',
    "sessionEmbedding" DOUBLE PRECISION[],
    "deviceType" TEXT,
    "country" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnonymousProfile" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "deviceFingerprint" TEXT,
    "country" TEXT,
    "deviceType" TEXT,
    "firstSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "viewedCategories" JSONB NOT NULL DEFAULT '[]',
    "viewedProducts" JSONB NOT NULL DEFAULT '[]',
    "searchQueries" JSONB NOT NULL DEFAULT '[]',
    "priceRangeSeen" JSONB NOT NULL DEFAULT '{}',
    "interestVector" DOUBLE PRECISION[],
    "convertedToUserId" TEXT,
    "convertedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnonymousProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");

-- CreateIndex
CREATE INDEX "UserProfile_userId_idx" ON "UserProfile"("userId");

-- CreateIndex
CREATE INDEX "UserProfile_buyerType_idx" ON "UserProfile"("buyerType");

-- CreateIndex
CREATE INDEX "UserProfile_country_idx" ON "UserProfile"("country");

-- CreateIndex
CREATE INDEX "UserProfile_engagementScore_idx" ON "UserProfile"("engagementScore");

-- CreateIndex
CREATE INDEX "UserProfile_purchaseIntent_idx" ON "UserProfile"("purchaseIntent");

-- CreateIndex
CREATE UNIQUE INDEX "UserSession_sessionId_key" ON "UserSession"("sessionId");

-- CreateIndex
CREATE INDEX "UserSession_sessionId_idx" ON "UserSession"("sessionId");

-- CreateIndex
CREATE INDEX "UserSession_userId_idx" ON "UserSession"("userId");

-- CreateIndex
CREATE INDEX "UserSession_expiresAt_idx" ON "UserSession"("expiresAt");

-- CreateIndex
CREATE INDEX "UserSession_currentCategory_idx" ON "UserSession"("currentCategory");

-- CreateIndex
CREATE UNIQUE INDEX "AnonymousProfile_sessionId_key" ON "AnonymousProfile"("sessionId");

-- CreateIndex
CREATE INDEX "AnonymousProfile_sessionId_idx" ON "AnonymousProfile"("sessionId");

-- CreateIndex
CREATE INDEX "AnonymousProfile_deviceFingerprint_idx" ON "AnonymousProfile"("deviceFingerprint");

-- CreateIndex
CREATE INDEX "AnonymousProfile_country_idx" ON "AnonymousProfile"("country");

-- CreateIndex
CREATE INDEX "AnonymousProfile_expiresAt_idx" ON "AnonymousProfile"("expiresAt");

-- CreateIndex
CREATE INDEX "ForYouScore_context_idx" ON "ForYouScore"("context");

-- CreateIndex
CREATE INDEX "ForYouScore_decay_idx" ON "ForYouScore"("decay");

-- CreateIndex
CREATE UNIQUE INDEX "ForYouScore_userId_productId_variantId_version_context_key" ON "ForYouScore"("userId", "productId", "variantId", "version", "context");

-- CreateIndex
CREATE INDEX "Interaction_duration_idx" ON "Interaction"("duration");

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interaction" ADD CONSTRAINT "Interaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
