-- Migration: add_user_role
-- Adds a UserRole enum and a `role` column to the User table.
-- New users default to USER. Existing users get USER by default.
-- Run admin seeding via the ADMIN_EMAILS env var on next API startup.

CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

ALTER TABLE "User"
ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'USER';