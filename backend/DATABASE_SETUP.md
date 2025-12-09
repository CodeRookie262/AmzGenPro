# ⚠️ 此文档已过时

**项目已迁移到本地 JSON 数据库，不再使用 MySQL。**

请参考 `LOCAL_DATABASE.md` 了解当前数据库配置。

---

# 数据库创建指南（已过时 - MySQL 版本）

## 字符集和排序规则说明

### 推荐配置
- **字符集 (CHARACTER SET)**: `utf8mb4`
- **排序规则 (COLLATE)**: `utf8mb4_unicode_ci`

### 为什么选择 utf8mb4？

1. **完整 UTF-8 支持**：
   - `utf8mb4` 是 MySQL 5.5.3+ 引入的完整 UTF-8 实现
   - 支持 4 字节字符（如 emoji 表情符号 👑）
   - 支持所有中文、日文、韩文等字符

2. **为什么不用 utf8？**
   - MySQL 的 `utf8` 只支持 3 字节字符
   - 不支持 emoji 等 4 字节字符
   - 可能导致数据截断或错误

### 排序规则选择

#### utf8mb4_unicode_ci（推荐）
- ✅ 基于 Unicode 标准排序
- ✅ 对中文、日文、韩文等多语言支持更好
- ✅ 排序更准确
- ⚠️ 性能稍慢（但现代服务器影响很小）

#### utf8mb4_general_ci（备选）
- ✅ 性能稍快
- ⚠️ 排序准确性稍差
- ⚠️ 对某些特殊字符处理不够精确

**建议使用 `utf8mb4_unicode_ci`**，因为：
- 您的项目包含中文内容
- 用户头像使用 emoji（👑、👤）
- 现代服务器性能足够好

## 创建数据库的方法

### 方法 1: 使用 MySQL 命令行

```bash
mysql -h 47.238.255.160 -u root -p
```

然后执行：
```sql
CREATE DATABASE IF NOT EXISTS `amazongen` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;
```

### 方法 2: 使用 MySQL Workbench / Navicat 等工具

1. 连接到服务器 `47.238.255.160`
2. 右键点击数据库列表
3. 选择 "Create Database"
4. 设置：
   - Database Name: `amazongen`
   - Character Set: `utf8mb4`
   - Collation: `utf8mb4_unicode_ci`
5. 点击创建

### 方法 3: 直接执行 SQL 文件

```bash
mysql -h 47.238.255.160 -u root -p < CREATE_DATABASE.sql
```

## 验证数据库创建

```sql
-- 查看数据库字符集
SHOW CREATE DATABASE `amazongen`;

-- 或者
SELECT 
    SCHEMA_NAME as 'Database',
    DEFAULT_CHARACTER_SET_NAME as 'Charset',
    DEFAULT_COLLATION_NAME as 'Collation'
FROM information_schema.SCHEMATA
WHERE SCHEMA_NAME = 'amazongen';
```

应该看到：
```
Database: amazongen
Charset: utf8mb4
Collation: utf8mb4_unicode_ci
```

## 创建数据库后的步骤

1. ✅ 创建数据库（使用上面的 SQL）
2. ✅ 运行迁移：`npm run migrate`
3. ✅ 启动服务：`npm run dev`

## 完整的 SQL 命令

```sql
-- 创建数据库
CREATE DATABASE IF NOT EXISTS `amazongen` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- 使用数据库
USE `amazongen`;

-- 验证
SHOW CREATE DATABASE `amazongen`;
```

