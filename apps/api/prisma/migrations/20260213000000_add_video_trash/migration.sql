ALTER TABLE "Video" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "Video" ADD COLUMN "deletedById" TEXT;

CREATE INDEX "Video_deletedAt_idx" ON "Video"("deletedAt");

ALTER TABLE "Video"
ADD CONSTRAINT "Video_deletedById_fkey"
FOREIGN KEY ("deletedById") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
