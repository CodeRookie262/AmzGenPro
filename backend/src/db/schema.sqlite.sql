-- AmazonGen SQLite Database Schema
-- 数据库文件位置: backend/data/amazongen.db

-- Users Table
CREATE TABLE IF NOT EXISTS `users` (
  `id` TEXT PRIMARY KEY,
  `name` TEXT NOT NULL UNIQUE,
  `password_hash` TEXT NOT NULL,
  `role` TEXT NOT NULL DEFAULT 'user' CHECK(`role` IN ('admin', 'user')),
  `avatar` TEXT DEFAULT NULL,
  `created_at` INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  `updated_at` INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX IF NOT EXISTS `idx_users_name` ON `users`(`name`);
CREATE INDEX IF NOT EXISTS `idx_users_role` ON `users`(`role`);

-- Product Masks Table (Public masks managed by admin)
CREATE TABLE IF NOT EXISTS `product_masks` (
  `id` TEXT PRIMARY KEY,
  `name` TEXT NOT NULL,
  `prompt_model` TEXT NOT NULL,
  `is_public` INTEGER NOT NULL DEFAULT 1,
  `created_by` TEXT DEFAULT NULL,
  `created_at` INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  `updated_at` INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS `idx_masks_public` ON `product_masks`(`is_public`);
CREATE INDEX IF NOT EXISTS `idx_masks_created_by` ON `product_masks`(`created_by`);

-- Image Definitions Table (Lenses)
CREATE TABLE IF NOT EXISTS `image_definitions` (
  `id` TEXT PRIMARY KEY,
  `mask_id` TEXT NOT NULL,
  `name` TEXT NOT NULL,
  `prompt` TEXT NOT NULL,
  `sort_order` INTEGER NOT NULL DEFAULT 0,
  `created_at` INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  `updated_at` INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (`mask_id`) REFERENCES `product_masks`(`id`) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS `idx_definitions_mask_id` ON `image_definitions`(`mask_id`);

-- User Masks Table (User-specific masks)
CREATE TABLE IF NOT EXISTS `user_masks` (
  `id` TEXT PRIMARY KEY,
  `user_id` TEXT NOT NULL,
  `mask_id` TEXT NOT NULL,
  `created_at` INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  UNIQUE(`user_id`, `mask_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`mask_id`) REFERENCES `product_masks`(`id`) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS `idx_user_masks_user_id` ON `user_masks`(`user_id`);
CREATE INDEX IF NOT EXISTS `idx_user_masks_mask_id` ON `user_masks`(`mask_id`);

-- Generation History Table
CREATE TABLE IF NOT EXISTS `generation_history` (
  `id` TEXT PRIMARY KEY,
  `user_id` TEXT NOT NULL,
  `mask_id` TEXT NOT NULL,
  `definition_id` TEXT NOT NULL,
  `definition_name` TEXT NOT NULL,
  `source_image_url` TEXT DEFAULT NULL,
  `generated_image_url` TEXT DEFAULT NULL,
  `prompt` TEXT DEFAULT NULL,
  `optimized_prompt` TEXT DEFAULT NULL,
  `model` TEXT DEFAULT NULL,
  `status` TEXT NOT NULL DEFAULT 'pending' CHECK(`status` IN ('pending', 'processing', 'completed', 'failed')),
  `error_message` TEXT DEFAULT NULL,
  `metadata` TEXT DEFAULT NULL, -- JSON stored as TEXT
  `created_at` INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  `updated_at` INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`mask_id`) REFERENCES `product_masks`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`definition_id`) REFERENCES `image_definitions`(`id`) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS `idx_history_user_id` ON `generation_history`(`user_id`);
CREATE INDEX IF NOT EXISTS `idx_history_mask_id` ON `generation_history`(`mask_id`);
CREATE INDEX IF NOT EXISTS `idx_history_definition_id` ON `generation_history`(`definition_id`);
CREATE INDEX IF NOT EXISTS `idx_history_status` ON `generation_history`(`status`);
CREATE INDEX IF NOT EXISTS `idx_history_created_at` ON `generation_history`(`created_at`);

-- API Keys Table (User-specific API keys)
CREATE TABLE IF NOT EXISTS `api_keys` (
  `id` TEXT PRIMARY KEY,
  `user_id` TEXT NOT NULL UNIQUE,
  `google_api_key` TEXT DEFAULT NULL,
  `openrouter_api_key` TEXT DEFAULT NULL,
  `created_at` INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  `updated_at` INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);



