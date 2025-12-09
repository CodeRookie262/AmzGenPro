-- AmazonGen 数据库创建脚本
-- 字符集：utf8mb4 (支持完整的 UTF-8，包括中文、emoji 等)
-- 排序规则：utf8mb4_unicode_ci (Unicode 排序规则，对中文支持更好)

CREATE DATABASE IF NOT EXISTS `amazongen` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- 验证数据库创建
SHOW CREATE DATABASE `amazongen`;



