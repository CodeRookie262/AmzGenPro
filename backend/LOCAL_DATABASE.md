# 本地 SQLite 数据库说明

## ✅ 已切换到 SQLite 本地数据库

数据库文件位置：`backend/data/amazongen.db`

## 优势

1. **无需配置**：不需要单独的数据库服务器
2. **项目集成**：数据库文件就在项目中，方便备份和迁移
3. **简单易用**：开箱即用，无需安装 MySQL
4. **性能优秀**：SQLite 对于中小型应用性能很好

## 数据库文件位置

```
backend/
└── data/
    └── amazongen.db  ← 数据库文件（自动创建）
```

## 启动步骤

### 1. 安装依赖

```bash
cd backend
npm install
```

### 2. 运行数据库迁移

```bash
npm run migrate
```

这将：
- 创建 `data` 目录（如果不存在）
- 创建数据库文件 `amazongen.db`
- 创建所有表结构
- 插入默认管理员账号（admin/admin）

### 3. 启动服务

```bash
npm run dev
```

## 数据库管理

### 查看数据库文件

数据库文件位于：`backend/data/amazongen.db`

### 使用 SQLite 工具查看

可以使用以下工具查看和管理数据库：

1. **DB Browser for SQLite**（推荐）
   - 下载：https://sqlitebrowser.org/
   - 打开 `backend/data/amazongen.db` 文件

2. **VS Code 扩展**
   - 安装 "SQLite Viewer" 扩展
   - 右键点击 `.db` 文件查看

3. **命令行工具**
   ```bash
   sqlite3 backend/data/amazongen.db
   ```

### 备份数据库

直接复制 `backend/data/amazongen.db` 文件即可！

### 重置数据库

删除 `backend/data/amazongen.db` 文件，然后重新运行：
```bash
npm run migrate
```

## 注意事项

1. **数据库文件已加入 .gitignore**：不会提交到 Git
2. **备份建议**：定期备份 `data/amazongen.db` 文件
3. **并发访问**：SQLite 支持多读单写，适合中小型应用

## 默认账号

- 用户名：`admin`
- 密码：`admin`

## 迁移完成

✅ 已从 MySQL 迁移到 SQLite
✅ 所有 API 接口已更新
✅ 数据库文件自动创建
✅ 无需额外配置





