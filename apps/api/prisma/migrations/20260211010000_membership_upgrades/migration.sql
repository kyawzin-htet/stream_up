-- CreateEnum
CREATE TYPE "MembershipUpgradeStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "PricingSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PricingSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "durationMonths" INTEGER,
    "amount" DECIMAL(10,2) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PricingPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MembershipUpgradeRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "MembershipUpgradeStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "amountSnapshot" DECIMAL(10,2) NOT NULL,
    "currencySnapshot" TEXT NOT NULL,
    "planNameSnapshot" TEXT NOT NULL,
    "durationMonthsSnapshot" INTEGER,
    "paymentSlipFileId" TEXT NOT NULL,
    "paymentSlipMessageId" TEXT NOT NULL,
    "paymentSlipChannelId" TEXT NOT NULL,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MembershipUpgradeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MembershipUpgradeRequest_status_idx" ON "MembershipUpgradeRequest"("status");

-- CreateIndex
CREATE INDEX "MembershipUpgradeRequest_userId_idx" ON "MembershipUpgradeRequest"("userId");

-- CreateIndex
CREATE INDEX "MembershipUpgradeRequest_planId_idx" ON "MembershipUpgradeRequest"("planId");

-- AddForeignKey
ALTER TABLE "MembershipUpgradeRequest" ADD CONSTRAINT "MembershipUpgradeRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembershipUpgradeRequest" ADD CONSTRAINT "MembershipUpgradeRequest_planId_fkey" FOREIGN KEY ("planId") REFERENCES "PricingPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembershipUpgradeRequest" ADD CONSTRAINT "MembershipUpgradeRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
