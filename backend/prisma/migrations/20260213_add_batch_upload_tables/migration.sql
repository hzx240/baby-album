-- CreateTable: 批量上传任务表
CREATE TABLE "upload_tasks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "family_id" TEXT NOT NULL,
    "child_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "total_files" INTEGER NOT NULL DEFAULT 0,
    "uploaded_files" INTEGER NOT NULL DEFAULT 0,
    "failed_files" INTEGER NOT NULL DEFAULT 0,
    "total_bytes" INTEGER,
    "uploaded_bytes" INTEGER NOT NULL DEFAULT 0,
    "started_at" DATETIME,
    "completed_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "upload_tasks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "upload_tasks_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "upload_tasks_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "children" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable: 批量上传文件记录表
CREATE TABLE "upload_task_files" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "task_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "checksum" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "uploaded_bytes" INTEGER NOT NULL DEFAULT 0,
    "total_chunks" INTEGER NOT NULL DEFAULT 1,
    "uploaded_chunks" INTEGER NOT NULL DEFAULT 0,
    "photo_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "upload_task_files_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "upload_tasks" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "upload_task_files_photo_id_fkey" FOREIGN KEY ("photo_id") REFERENCES "photos" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable: 分片上传记录表
CREATE TABLE "chunk_uploads" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "file_record_id" TEXT NOT NULL,
    "chunk_index" INTEGER NOT NULL,
    "chunk_size" INTEGER NOT NULL,
    "etag" TEXT NOT NULL,
    "uploaded_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "chunk_uploads_file_record_id_fkey" FOREIGN KEY ("file_record_id") REFERENCES "upload_task_files" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex: upload_tasks
CREATE INDEX "upload_tasks_user_id_idx" ON "upload_tasks"("user_id");
CREATE INDEX "upload_tasks_family_id_idx" ON "upload_tasks"("family_id");
CREATE INDEX "upload_tasks_status_idx" ON "upload_tasks"("status");
CREATE INDEX "upload_tasks_created_at_idx" ON "upload_tasks"("created_at" DESC);

-- CreateIndex: upload_task_files
CREATE INDEX "upload_task_files_task_id_idx" ON "upload_task_files"("task_id");
CREATE INDEX "upload_task_files_status_idx" ON "upload_task_files"("status");
CREATE INDEX "upload_task_files_checksum_idx" ON "upload_task_files"("checksum");

-- CreateIndex: chunk_uploads
CREATE INDEX "chunk_uploads_file_record_id_idx" ON "chunk_uploads"("file_record_id");

-- CreateUniqueIndex: chunk_uploads
CREATE UNIQUE INDEX "chunk_uploads_file_record_id_chunk_index_key" ON "chunk_uploads"("file_record_id", "chunk_index");
