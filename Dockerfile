FROM node:20-slim AS base

RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app/apps/api

COPY apps/api/package.json apps/api/package-lock.json ./
RUN npm ci

COPY apps/api/prisma ./prisma
COPY apps/api/prisma.config.ts ./prisma.config.ts
ARG DATABASE_URL=postgres://postgres:postgres@postgres:5432/stream_up
ENV DATABASE_URL=${DATABASE_URL}
RUN npm run prisma:generate

COPY apps/api/tsconfig.json ./tsconfig.json
COPY apps/api/nest-cli.json ./nest-cli.json
COPY apps/api/src ./src

RUN npm run build
RUN npm prune --omit=dev

ENV NODE_ENV=production
EXPOSE 3001

CMD ["node", "dist/main.js"]
