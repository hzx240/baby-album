-- CreateTable: Phase 3 Models
-- Migration: add_phase3_models
-- Date: 2026-02-28
-- Description: 添加Phase 3所需的5个数据库模型

-- ========================================
-- 1. GrowthRecord - 成长记录
-- ========================================
CREATE TABLE IF NOT EXISTS "growth_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "child_id" TEXT NOT NULL,
    "record_date" DATETIME NOT NULL,
    "height" REAL,
    "weight" REAL,
    "head_circ" REAL,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "growth_records_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "children" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Indexes for GrowthRecord
CREATE UNIQUE INDEX "growth_records_child_id_record_date_key" ON "growth_records"("child_id", "record_date");
CREATE INDEX "growth_records_child_id_record_date_idx" ON "growth_records"("child_id", "record_date" DESC);

-- ========================================
-- 2. GrowthReport - 成长报告
-- ========================================
CREATE TABLE IF NOT EXISTS "growth_reports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "child_id" TEXT NOT NULL,
    "start_date" DATETIME NOT NULL,
    "end_date" DATETIME NOT NULL,
    "report_type" TEXT NOT NULL,
    "content" TEXT,
    "pdf_url" TEXT,
    "image_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "error_message" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" DATETIME,
    CONSTRAINT "growth_reports_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "children" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Indexes for GrowthReport
CREATE INDEX "growth_reports_child_id_created_at_idx" ON "growth_reports"("child_id", "created_at" DESC);
CREATE INDEX "growth_reports_status_idx" ON "growth_reports"("status");

-- ========================================
-- 3. MilestoneReminder - 里程碑提醒
-- ========================================
CREATE TABLE IF NOT EXISTS "milestone_reminders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "child_id" TEXT NOT NULL,
    "milestone_type" TEXT NOT NULL,
    "milestone_name" TEXT NOT NULL,
    "description" TEXT,
    "age_months" INTEGER NOT NULL,
    "reminder_date" DATETIME NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" DATETIME,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "milestone_reminders_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "children" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Indexes for MilestoneReminder
CREATE INDEX "milestone_reminders_child_id_reminder_date_idx" ON "milestone_reminders"("child_id", "reminder_date" DESC);
CREATE INDEX "milestone_reminders_child_id_is_read_idx" ON "milestone_reminders"("child_id", "is_read");
CREATE INDEX "milestone_reminders_is_read_idx" ON "milestone_reminders"("is_read");

-- ========================================
-- 4. ShareLink - 分享链接
-- ========================================
CREATE TABLE IF NOT EXISTS "share_links" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "album_id" TEXT NOT NULL,
    "family_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "password" TEXT,
    "title" TEXT,
    "description" TEXT,
    "theme" TEXT,
    "allow_comments" BOOLEAN NOT NULL DEFAULT false,
    "allow_download" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" DATETIME,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "comment_count" INTEGER NOT NULL DEFAULT 0,
    "last_viewed_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "share_links_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "albums" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "share_links_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Indexes for ShareLink
CREATE UNIQUE INDEX "share_links_token_key" ON "share_links"("token");
CREATE INDEX "share_links_token_idx" ON "share_links"("token");
CREATE INDEX "share_links_family_id_idx" ON "share_links"("family_id");
CREATE INDEX "share_links_album_id_idx" ON "share_links"("album_id");
CREATE INDEX "share_links_expires_at_idx" ON "share_links"("expires_at");

-- ========================================
-- 5. ShareComment - 分享评论
-- ========================================
CREATE TABLE IF NOT EXISTS "share_comments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "share_link_id" TEXT NOT NULL,
    "author_name" TEXT NOT NULL,
    "author_email" TEXT,
    "content" TEXT NOT NULL,
    "emoji" TEXT,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "parent_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "share_comments_share_link_id_fkey" FOREIGN KEY ("share_link_id") REFERENCES "share_links" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "share_comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "share_comments" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Indexes for ShareComment
CREATE INDEX "share_comments_share_link_id_created_at_idx" ON "share_comments"("share_link_id", "created_at" DESC);
CREATE INDEX "share_comments_parent_id_idx" ON "share_comments"("parent_id");

-- ========================================
-- Migration Complete
-- ========================================
-- Phase 3 Models Created:
-- 1. GrowthRecord (成长记录)
-- 2. GrowthReport (成长报告)
-- 3. MilestoneReminder (里程碑提醒)
-- 4. ShareLink (分享链接)
-- 5. ShareComment (分享评论)
