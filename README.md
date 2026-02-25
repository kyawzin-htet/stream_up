# StreamUp

StreamUp is a Telegram-backed video platform built as a monorepo:

- `apps/web`: Next.js 14 (App Router) frontend
- `apps/api`: NestJS API + Prisma + PostgreSQL
- Telegram Bot API for private storage and membership delivery

## Architecture

Request flow:

1. Browser/UI requests go to Next.js (`apps/web`).
2. Next.js server routes proxy to NestJS (`apps/api`) for authenticated operations.
3. NestJS persists app metadata in PostgreSQL and stores media in a private Telegram channel.
4. Stream requests are proxied by the API (with range support + local cache) so Telegram file URLs are not exposed to clients.

Membership flow:

1. User registers/logs in on web.
2. User links Telegram account through bot deep-link.
3. User submits payment slip for a plan.
4. Admin approves/rejects request.
5. On approval, API upgrades membership and sends single-use Telegram group invite.
6. Hourly cron enforces expiration and removes expired users from group.

## Current Functionality (Source of Truth: `apps/api/src` + `apps/web`)

- JWT auth: register, login, profile (`/auth/*`)
- Admin authorization by `ADMIN_EMAILS`
- Category list/create
- Video listing/search/pagination + detail
- **Admin upload pipeline:** file type/size validation, optional trim/transcode, GIF generation, Telegram upload, metadata persistence.
- **Video moderation:** soft delete to Trash, restore, permanent delete (also deletes Telegram message).
- **Playback endpoints:** `/videos/:id/stream` (public route with premium checks for premium videos) and `/videos/:id/preview` (JWT required).
- **Comments:** list per video, post comments, one-level replies, premium-only posting (admins bypass).
- **Membership and pricing:** plans/settings, pay-slip submission, admin approve/reject/list/summary/slip preview, direct admin membership update + sync.
- **Telegram integration:** webhook receiver (`/telegram/webhook`), account linking token + deep-link, invite creation, group removal on expiration.
- **Security defaults:** Helmet, rate limiting, global validation pipe, CORS scoped to `WEB_URL`.

## Project Structure

```text
.
├── apps/
│   ├── api/                     # NestJS API + Prisma schema/migrations
│   │   ├── src/
│   │   │   ├── auth/
│   │   │   ├── videos/
│   │   │   ├── memberships/
│   │   │   ├── comments/
│   │   │   ├── telegram/
│   │   │   ├── categories/
│   │   │   └── admin/
│   │   └── prisma/
│   └── web/                     # Next.js App Router app + route handlers
├── docker-compose.yml           # Postgres + API container
└── Dockerfile                   # API production image (includes ffmpeg)
```

## Prerequisites

- Node.js 20+
- npm
- PostgreSQL 16 (or use Docker Compose)
- `ffmpeg` and `ffprobe` installed locally when running API outside Docker
- Telegram bot + private channel + private group configured

## Environment Variables

### API (`apps/api/.env` for local API dev)

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/stream_up
JWT_SECRET=change-me
JWT_EXPIRES_IN=7d
APP_URL=http://localhost:3001
WEB_URL=http://localhost:3000
ADMIN_EMAILS=admin@example.com

TELEGRAM_BOT_TOKEN=<bot_token>
TELEGRAM_BOT_USERNAME=<bot_username_without_@>
TELEGRAM_CHANNEL_ID=-100xxxxxxxxxx
TELEGRAM_GROUP_ID=-100yyyyyyyyyy
TELEGRAM_WEBHOOK_SECRET=<optional_secret>

UPLOAD_MAX_MB=1024
UPLOAD_SOFT_MAX_MB=500
UPLOAD_MAX_DURATION_SEC=900
UPLOAD_GIF_DEFAULT_DURATION_SEC=6
UPLOAD_GIF_MAX_DURATION_SEC=12
UPLOAD_INBOX_DIR=/tmp/streamup-upload-inbox
VIDEO_CACHE_DIR=/tmp/streamup-video-cache
VIDEO_CACHE_TTL_MS=21600000

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=2000
RATE_LIMIT_DISABLED=false
PORT=3001
```

### Web (`apps/web/.env.local`)

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Root `.env` (used by `docker compose` for API service)

`docker-compose.yml` reads root `.env` via `env_file`. Mirror the API vars you need in root `.env` when running the API container.

## Local Development

### 1. Start Postgres

```bash
docker compose up -d postgres
```

### 2. Install dependencies

```bash
cd apps/api && npm install
cd ../web && npm install
```

### 3. Run Prisma migrations

```bash
cd apps/api
npm run prisma:deploy
```

### 4. Start API + Web

Terminal 1:

```bash
cd apps/api
npm run start:dev
```

Terminal 2:

```bash
cd apps/web
npm run dev
```

- Web: `http://localhost:3000`
- API: `http://localhost:3001`

## Docker API Run (Alternative)

If you want Postgres + API in Docker:

```bash
docker compose up -d --build api
docker compose exec api npm run prisma:deploy
```

Then run web locally (`apps/web`) with `NEXT_PUBLIC_API_URL=http://localhost:3001`.

## Key Backend Endpoints

Public:

- `POST /auth/register`
- `POST /auth/login`
- `GET /categories`
- `GET /videos`
- `GET /videos/:id`
- `GET /videos/:id/stream`
- `GET /videos/:id/comments`
- `POST /telegram/webhook`
- `GET /pricing/plans`

Authenticated user:

- `GET /auth/me`
- `POST /auth/telegram-link`
- `GET /videos/:id/preview`
- `POST /videos/:id/comments`
- `POST /comments/:id/replies`
- `POST /membership-upgrades`
- `GET /membership-upgrades/me`

Admin:

- `GET /admin/status`
- `GET /admin/members`
- `POST /categories`
- `POST /admin/memberships/:userId`
- `POST /admin/memberships/sync`
- `GET /videos/admin`
- `POST /videos`
- `PATCH /videos/:id/trash`
- `PATCH /videos/:id/restore`
- `DELETE /videos/:id`
- `PUT /pricing/settings`
- `GET /pricing/plans/all`
- `PUT /pricing/plans/:id`
- `GET /admin/membership-upgrades`
- `GET /admin/membership-upgrades/summary`
- `POST /admin/membership-upgrades/:id/approve`
- `POST /admin/membership-upgrades/:id/reject`
- `GET /admin/membership-upgrades/:id/slip`

## Telegram Setup Notes

- Create one private channel for file storage.
- Create one private group for premium members.
- Add bot as admin in both channel and group.
- Set `TELEGRAM_CHANNEL_ID` and `TELEGRAM_GROUP_ID`.
- For webhook mode, point Telegram webhook to `POST /telegram/webhook` and set matching `TELEGRAM_WEBHOOK_SECRET`.
- Account linking uses deep-link format: `https://t.me/<bot_username>?start=link_<token>`.

## Notes

- Prisma schema lives at `apps/api/prisma/schema.prisma`.
- API upload processing depends on `ffmpeg`/`ffprobe`.
- The web app includes routes/components for GIF previews and likes. Ensure corresponding API handlers are present in your running backend build when enabling those UI paths.
