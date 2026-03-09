CREATE TABLE "GalleryImage" (
    "id" TEXT NOT NULL,
    "telegramFileId" TEXT NOT NULL,
    "telegramMessageId" TEXT NOT NULL,
    "telegramChannelId" TEXT NOT NULL,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploaderId" TEXT,

    CONSTRAINT "GalleryImage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GalleryImage_createdAt_idx" ON "GalleryImage"("createdAt");
CREATE INDEX "GalleryImage_isPremium_idx" ON "GalleryImage"("isPremium");

ALTER TABLE "GalleryImage"
ADD CONSTRAINT "GalleryImage_uploaderId_fkey"
FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
