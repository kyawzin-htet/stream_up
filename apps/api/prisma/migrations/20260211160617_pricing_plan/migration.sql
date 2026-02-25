-- DropForeignKey
ALTER TABLE "MembershipUpgradeRequest" DROP CONSTRAINT "MembershipUpgradeRequest_userId_fkey";

-- AlterTable
ALTER TABLE "PricingPlan" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "PricingSettings" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "MembershipUpgradeRequest" ADD CONSTRAINT "MembershipUpgradeRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
