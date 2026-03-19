-- CreateEnum
CREATE TYPE "SourcingRequestStatus" AS ENUM ('PENDING', 'IN_REVIEW', 'QUOTED', 'RESPONDED', 'CLOSED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "SourcingRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "productType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "quantityUnit" TEXT NOT NULL,
    "budgetMin" DOUBLE PRECISION,
    "budgetMax" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'XOF',
    "deadline" TIMESTAMP(3),
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "company" TEXT,
    "status" "SourcingRequestStatus" NOT NULL DEFAULT 'PENDING',
    "documents" JSONB,
    "adminNotes" TEXT,
    "response" TEXT,
    "responseFile" JSONB,
    "viewedAt" TIMESTAMP(3),
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SourcingRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SourcingRequest_userId_idx" ON "SourcingRequest"("userId");

-- CreateIndex
CREATE INDEX "SourcingRequest_status_idx" ON "SourcingRequest"("status");

-- CreateIndex
CREATE INDEX "SourcingRequest_createdAt_idx" ON "SourcingRequest"("createdAt");

-- CreateIndex
CREATE INDEX "SourcingRequest_email_idx" ON "SourcingRequest"("email");

-- AddForeignKey
ALTER TABLE "SourcingRequest" ADD CONSTRAINT "SourcingRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
