CREATE TABLE "GalleryImageGroup" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploaderId" TEXT,

    CONSTRAINT "GalleryImageGroup_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GalleryImageLike" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GalleryImageLike_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GalleryImageGroup_createdAt_idx" ON "GalleryImageGroup"("createdAt");
CREATE INDEX "GalleryImageGroup_isPremium_idx" ON "GalleryImageGroup"("isPremium");
CREATE INDEX "GalleryImageGroup_title_idx" ON "GalleryImageGroup"("title");
CREATE INDEX "GalleryImageLike_groupId_idx" ON "GalleryImageLike"("groupId");
CREATE INDEX "GalleryImageLike_userId_idx" ON "GalleryImageLike"("userId");

ALTER TABLE "GalleryImage" ADD COLUMN "groupId" TEXT;

INSERT INTO "GalleryImageGroup" ("id", "title", "tags", "isPremium", "createdAt", "uploaderId")
SELECT
    "id",
    'Imported image',
    ARRAY[]::TEXT[],
    "isPremium",
    "createdAt",
    "uploaderId"
FROM "GalleryImage";

UPDATE "GalleryImage"
SET "groupId" = "id"
WHERE "groupId" IS NULL;

ALTER TABLE "GalleryImage" ALTER COLUMN "groupId" SET NOT NULL;

CREATE INDEX "GalleryImage_groupId_idx" ON "GalleryImage"("groupId");

CREATE UNIQUE INDEX "GalleryImageLike_userId_groupId_key" ON "GalleryImageLike"("userId", "groupId");

ALTER TABLE "GalleryImageGroup"
ADD CONSTRAINT "GalleryImageGroup_uploaderId_fkey"
FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "GalleryImage"
ADD CONSTRAINT "GalleryImage_groupId_fkey"
FOREIGN KEY ("groupId") REFERENCES "GalleryImageGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GalleryImageLike"
ADD CONSTRAINT "GalleryImageLike_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GalleryImageLike"
ADD CONSTRAINT "GalleryImageLike_groupId_fkey"
FOREIGN KEY ("groupId") REFERENCES "GalleryImageGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
