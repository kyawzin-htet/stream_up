# StreamUp — Telegram-Backed Video Platform

Production-ready web platform that stores videos in a private Telegram channel, enforces membership access, and provides SEO-friendly browsing.

**Stack**

- Frontend: Next.js (App Router), TypeScript, Tailwind CSS
- Backend: NestJS, TypeScript, PostgreSQL (Prisma), JWT
- Telegram: Bot API + private channel + private group

## Architecture Overview

- Videos are uploaded via the website to the backend.
- Backend uploads videos to a private Telegram channel, stores `file_id` + metadata in PostgreSQL.
- Streaming is proxied by the backend to prevent direct Telegram file access.
- Membership determines access; premium users receive invite links to the private group.

## Project Structure

- `apps/api` NestJS backend
- `apps/web` Next.js frontend

## Quick Start (Local)

1. Start Postgres:

```bash
cd /Users/kyawzinhtet/Projects/personal/stream_up
cat <<'ENV' > /Users/kyawzinhtet/Projects/personal/stream_up/apps/api/.env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/stream_up
JWT_SECRET=change-me
JWT_EXPIRES_IN=7d
APP_URL=http://localhost:3001
WEB_URL=http://localhost:3000
TELEGRAM_BOT_TOKEN=replace
TELEGRAM_BOT_USERNAME=replace
TELEGRAM_CHANNEL_ID=-1001234567890
TELEGRAM_GROUP_ID=-1001234567891
UPLOAD_MAX_MB=1024
ADMIN_EMAILS=admin@example.com
ENV

cat <<'ENV' > /Users/kyawzinhtet/Projects/personal/stream_up/apps/web/.env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=replace
ENV
```

2. Run Postgres:

```bash
cd /Users/kyawzinhtet/Projects/personal/stream_up
docker compose up -d

docker compose up -d --build api

```

3. Apply Prisma schema:

```bash
cd /Users/kyawzinhtet/Projects/personal/stream_up/apps/api
npx prisma migrate deploy
```

4. Start backend & frontend:

```bash
cd /Users/kyawzinhtet/Projects/personal/stream_up/apps/api
npm install
npm run start:dev

cd /Users/kyawzinhtet/Projects/personal/stream_up/apps/web
npm install
npm run dev
```

## Example API Requests

### Register

```bash
curl -X POST http://localhost:3001/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"user@example.com","password":"StrongPass123!"}'
```

Response:

```json
{
  "accessToken": "...",
  "user": {
    "id": "...",
    "email": "user@example.com",
    "membershipType": "FREE",
    "membershipExpiresAt": null,
    "telegramUserId": null,
    "isAdmin": false
  }
}
```

### Login

```bash
curl -X POST http://localhost:3001/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"user@example.com","password":"StrongPass123!"}'
```

### Upload Video (Admin)

```bash
curl -X POST http://localhost:3001/videos \
  -H 'Authorization: Bearer <token>' \
  -F 'file=@/path/to/video.mp4' \
  -F 'title=Demo Video' \
  -F 'description=Test upload' \
  -F 'categoryId=<category-id>' \
  -F 'keywords=demo,stream,telegram' \
  -F 'isPremium=true'
```

### Stream Video

```bash
curl -L http://localhost:3001/videos/<video-id>/stream \
  -H 'Authorization: Bearer <token>'
```

## Telegram Setup Notes

- Create a private channel and a private group.
- Add your bot as admin in both.
- Save the channel/group IDs in `.env`.
- Set webhook to `POST /telegram/webhook` (optional) or use long polling.

## Security Notes

- JWTs are required for streaming.
- Backend proxies Telegram file streams and never exposes direct file URLs.
- Rate limiting and file validation are enabled server-side.
