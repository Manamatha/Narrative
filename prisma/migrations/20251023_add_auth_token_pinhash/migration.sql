-- Migration: add pinHash to User and create AuthToken table
-- PLEASE review before applying. Designed for PostgreSQL.

BEGIN;

-- Make existing pin column nullable (legacy)
ALTER TABLE "User" ALTER COLUMN "pin" DROP NOT NULL;

-- Add pinHash column
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "pinHash" TEXT;

-- Create AuthToken table
CREATE TABLE IF NOT EXISTS "AuthToken" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "token" TEXT NOT NULL UNIQUE,
  "expiresAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT fk_user FOREIGN KEY("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "AuthToken_userId_idx" ON "AuthToken" ("userId");

COMMIT;
