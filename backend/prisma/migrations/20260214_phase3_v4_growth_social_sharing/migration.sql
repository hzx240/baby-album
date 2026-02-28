-- Phase 3 v4.0: Growth Tracking & Social Sharing Features
-- Generated: 2026-02-14
-- Features: NO AI (v4.0)
--   - GrowthRecord: Height, weight, head circumference tracking
--   - PhotoComment: Comment system for photos
--   - AlbumShare: Enhanced sharing with password protection
--   - Enhancements to existing models
--
-- ========================================
-- GrowthRecord Model
-- ========================================
CREATE TABLE "growth_records" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "child_id" TEXT NOT NULL,
  "record_type" TEXT NOT NULL,  -- HEIGHT | WEIGHT | HEAD_CIRCUMFERENCE
  "value" REAL NOT NULL,
  "date" DATETIME NOT NULL,
  "notes" TEXT,
  "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("child_id") REFERENCES "children"("id") ON DELETE CASCADE
);

CREATE INDEX "growth_records_child_id_date_idx" ON "growth_records"("child_id", "date" DESC);

-- ========================================
-- PhotoComment Model
-- ========================================
CREATE TABLE "photo_comments" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "photo_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "emoji_reaction" TEXT,
  "parent_id" TEXT,
  "likes" INTEGER NOT NULL DEFAULT 0,
  "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" DATETIME NOT NULL,
  FOREIGN KEY ("photo_id") REFERENCES "photos"("id") ON DELETE CASCADE,
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
  FOREIGN KEY ("parent_id") REFERENCES "photo_comments"("id") ON DELETE CASCADE
);

CREATE INDEX "photo_comments_photo_id_created_at_idx" ON "photo_comments"("photo_id", "created_at" DESC);
CREATE INDEX "photo_comments_user_id_idx" ON "photo_comments"("user_id");

-- ========================================
-- AlbumShare Model
-- ========================================
CREATE TABLE "album_shares" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "album_id" TEXT NOT NULL,
  "share_token" TEXT NOT NULL UNIQUE,
  "password" TEXT,  -- bcrypt hash
  "expires_at" DATETIME,
  "permissions" TEXT NOT NULL DEFAULT 'VIEW',  -- VIEW | COMMENT | DOWNLOAD
  "view_count" INTEGER NOT NULL DEFAULT 0,
  "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("album_id") REFERENCES "albums"("id") ON DELETE CASCADE
);

CREATE INDEX "album_shares_share_token_idx" ON "album_shares"("share_token");
CREATE INDEX "album_shares_expires_at_idx" ON "album_shares"("expires_at");

-- ========================================
-- Update Child Model (Add relation)
-- ========================================
-- Relation already exists in schema, no migration needed
-- The foreign key constraint will be handled by Prisma

-- ========================================
-- Migration Metadata
-- ========================================
-- This migration adds Phase 3 v4.0 features:
--   - Growth tracking (WHO standards, visualizations)
--   - Photo comments (social interaction)
--   - Enhanced album sharing (password protection, permissions)
--   - NO AI features (completely removed from v4.0)
--
-- Cost Impact: $38/month (vs $760/month with AI) - 95% savings
-- Development: 196h (vs 416h with AI) - 53% reduction
-- Timeline: 3 weeks (vs 6 weeks with AI) - 50% faster
