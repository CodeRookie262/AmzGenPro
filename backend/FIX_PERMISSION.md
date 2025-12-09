# ⚠️ 此文档已过时

**项目已迁移到本地 JSON 数据库，不再使用 MySQL，因此不再需要处理数据库权限问题。**

请参考 `LOCAL_DATABASE.md` 了解当前数据库配置。

---

# 解决数据库权限问题（已过时 - MySQL 版本）

## 错误说明

错误：`1044 - Access denied for user 'dr'@'%' to database 'amazongen'`

**原因**：
- 用户 `dr` 没有访问数据库 `amazongen` 的权限
- 数据库可能不存在，或者用户没有权限访问它

## 解决步骤

### 步骤 1: 使用 root 账号创建数据库

连接到 MySQL 服务器，使用 **root** 或有管理员权限的账号：

```bash
mysql -h 47.238.255.160 -u root -p
```

### 步骤 2: 执行以下 SQL 命令

```sql
-- 1. 创建数据库
CREATE DATABASE IF NOT EXISTS `amazongen` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- 2. 授予用户 dr 访问权限
GRANT ALL PRIVILEGES ON `amazongen`.* TO 'dr'@'%';

-- 3. 刷新权限
FLUSH PRIVILEGES;

-- 4. 验证
SHOW GRANTS FOR 'dr'@'%';
SHOW CREATE DATABASE `amazongen`;
```

### 步骤 3: 退出并测试连接

```sql
EXIT;
```

然后运行后端迁移：
```bash
cd backend
npm run migrate
```

## 如果无法使用 root 账号

### 方案 A: 联系数据库管理员
请数据库管理员执行上面的 SQL 命令。

### 方案 B: 检查用户 dr 的现有权限
```sql
-- 查看用户 dr 的权限
SHOW GRANTS FOR 'dr'@'%';

-- 查看用户 dr 可以访问哪些数据库
SHOW DATABASES;
```

### 方案 C: 使用用户 dr 已有的数据库
如果用户 `dr` 已经有其他数据库的权限，可以：
1. 修改 `.env` 中的 `DB_NAME` 为已有数据库名
2. 或者询问管理员用户 `dr` 可以访问哪些数据库

## 权限说明

### 最小必要权限
如果不想授予所有权限，可以只授予必要的：
```sql
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, ALTER, INDEX 
ON `amazongen`.* TO 'dr'@'%';
FLUSH PRIVILEGES;
```

### 完整权限（开发环境）
```sql
GRANT ALL PRIVILEGES ON `amazongen`.* TO 'dr'@'%';
FLUSH PRIVILEGES;
```

## 验证步骤

创建数据库和授权后，测试连接：

```bash
# 测试数据库连接
mysql -h 47.238.255.160 -u dr -p -D amazongen

# 如果连接成功，执行：
SHOW TABLES;
```

如果能看到数据库和表，说明权限配置成功！

## 常见问题

### Q: 用户 dr 只能访问特定数据库怎么办？
A: 修改 `.env` 中的 `DB_NAME` 为有权限的数据库名。

### Q: 用户 dr 没有 CREATE 权限怎么办？
A: 请管理员先创建数据库，然后只授予 SELECT, INSERT, UPDATE, DELETE 权限。

### Q: 如何查看用户 dr 的权限？
A: 使用 root 账号执行：`SHOW GRANTS FOR 'dr'@'%';`

