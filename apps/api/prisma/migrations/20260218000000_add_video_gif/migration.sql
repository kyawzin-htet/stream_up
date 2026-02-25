-- Add Telegram GIF metadata for card previews.
ALTER TABLE "Video"
  ADD COLUMN "telegramGifFileId" TEXT,
  ADD COLUMN "telegramGifMessageId" TEXT,
  ADD COLUMN "telegramGifChannelId" TEXT;
