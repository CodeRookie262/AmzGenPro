-- AmazonGen Database Schema
-- Database: amazongen
-- Character Set: utf8mb4
-- Collation: utf8mb4_unicode_ci

-- Note: Make sure database is created with:
-- CREATE DATABASE `amazongen` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Users Table
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(36) PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'user') NOT NULL DEFAULT 'user',
  `avatar` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_name` (`name`),
  INDEX `idx_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Product Masks Table (Public masks managed by admin)
CREATE TABLE IF NOT EXISTS `product_masks` (
  `id` VARCHAR(36) PRIMARY KEY,
  `name` VARCHAR(200) NOT NULL,
  `prompt_model` VARCHAR(100) NOT NULL,
  `is_public` BOOLEAN DEFAULT TRUE,
  `created_by` VARCHAR(36) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_public` (`is_public`),
  INDEX `idx_created_by` (`created_by`),
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Image Definitions Table (Lenses)
CREATE TABLE IF NOT EXISTS `image_definitions` (
  `id` VARCHAR(36) PRIMARY KEY,
  `mask_id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(200) NOT NULL,
  `prompt` TEXT NOT NULL,
  `sort_order` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_mask_id` (`mask_id`),
  FOREIGN KEY (`mask_id`) REFERENCES `product_masks`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User Masks Table (User-specific masks)
CREATE TABLE IF NOT EXISTS `user_masks` (
  `id` VARCHAR(36) PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL,
  `mask_id` VARCHAR(36) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_user_mask` (`user_id`, `mask_id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_mask_id` (`mask_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`mask_id`) REFERENCES `product_masks`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Generation History Table
CREATE TABLE IF NOT EXISTS `generation_history` (
  `id` VARCHAR(36) PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL,
  `mask_id` VARCHAR(36) NOT NULL,
  `definition_id` VARCHAR(36) NOT NULL,
  `definition_name` VARCHAR(200) NOT NULL,
  `source_image_url` VARCHAR(500) DEFAULT NULL,
  `generated_image_url` VARCHAR(500) DEFAULT NULL,
  `prompt` TEXT DEFAULT NULL,
  `optimized_prompt` TEXT DEFAULT NULL,
  `model` VARCHAR(100) DEFAULT NULL,
  `status` ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
  `error_message` TEXT DEFAULT NULL,
  `metadata` JSON DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_mask_id` (`mask_id`),
  INDEX `idx_definition_id` (`definition_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_created_at` (`created_at`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`mask_id`) REFERENCES `product_masks`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`definition_id`) REFERENCES `image_definitions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- API Keys Table (User-specific API keys)
CREATE TABLE IF NOT EXISTS `api_keys` (
  `id` VARCHAR(36) PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL,
  `google_api_key` VARCHAR(500) DEFAULT NULL,
  `openrouter_api_key` VARCHAR(500) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_user_keys` (`user_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default admin user (password: admin)
-- Password hash for 'admin' using bcrypt (cost 10)
INSERT INTO `users` (`id`, `name`, `password_hash`, `role`, `avatar`) 
VALUES (
  'admin-001',
  'admin',
  '$2a$10$rOzJqJqJqJqJqJqJqJqJqOqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJq',
  'admin',
  '👑'
) ON DUPLICATE KEY UPDATE `name`=`name`;

