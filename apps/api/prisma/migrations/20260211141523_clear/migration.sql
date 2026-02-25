-- DropForeignKey
ALTER TABLE "TelegramLinkToken" DROP CONSTRAINT "TelegramLinkToken_userId_fkey";

-- AddForeignKey
ALTER TABLE "TelegramLinkToken" ADD CONSTRAINT "TelegramLinkToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
