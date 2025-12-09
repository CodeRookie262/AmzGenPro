-- ============================================
-- AmazonGen 数据库完整设置脚本
-- 需要 root 或有 CREATE DATABASE 权限的账号执行
-- ============================================

-- 1. 创建数据库（使用 root 账号执行）
CREATE DATABASE IF NOT EXISTS `amazongen` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- 2. 授予用户 dr 访问权限（使用 root 账号执行）
-- 授予所有权限
GRANT ALL PRIVILEGES ON `amazongen`.* TO 'dr'@'%';

-- 或者只授予必要的权限（更安全）
-- GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, ALTER, INDEX ON `amazongen`.* TO 'dr'@'%';

-- 刷新权限
FLUSH PRIVILEGES;

-- 3. 验证权限
SHOW GRANTS FOR 'dr'@'%';

-- 4. 验证数据库
SHOW CREATE DATABASE `amazongen`;



