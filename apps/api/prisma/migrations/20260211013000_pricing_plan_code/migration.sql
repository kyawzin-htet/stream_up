ALTER TABLE "PricingPlan" ADD COLUMN "code" TEXT;

UPDATE "PricingPlan"
SET "code" = CASE
  WHEN lower("name") LIKE '%1 month%' THEN '1m'
  WHEN lower("name") LIKE '%2 month%' THEN '2m'
  WHEN lower("name") LIKE '%3 month%' THEN '3m'
  WHEN lower("name") LIKE '%lifetime%' THEN 'lifetime'
  ELSE NULL
END;

-- Remove rows that do not match a known plan code
DELETE FROM "PricingPlan" WHERE "code" IS NULL;

-- Keep only the newest plan for each code
DELETE FROM "PricingPlan" p
USING (
  SELECT "code", max("createdAt") as latest
  FROM "PricingPlan"
  GROUP BY "code"
) keep
WHERE p."code" = keep."code" AND p."createdAt" < keep.latest;

ALTER TABLE "PricingPlan" ALTER COLUMN "code" SET NOT NULL;

CREATE UNIQUE INDEX "PricingPlan_code_key" ON "PricingPlan"("code");
