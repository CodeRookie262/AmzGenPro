# 快速启动指南

## 1. 安装依赖

```bash
cd backend
npm install
```

## 2. 配置环境变量

创建 `.env` 文件（参考 `ENV_SETUP.md` 或直接复制以下内容）：

```env
PORT=3001
NODE_ENV=development
JWT_SECRET=amazongen-super-secret-key-2024-change-in-production
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
```

**注意**：项目使用本地 JSON 数据库，无需配置 MySQL 连接信息。

## 3. 运行数据库迁移

```bash
npm run migrate
```

这将：
- 自动创建本地 JSON 数据库文件（`backend/data/amazongen.json`）
- 创建所有必要的表结构
- 插入默认管理员账号（admin/admin）

## 4. 启动服务

开发模式（推荐）：
```bash
npm run dev
```

生产模式：
```bash
npm run build
npm start
```

## 5. 测试 API

服务启动后，访问：
- 健康检查：http://localhost:3001/health
- API 文档：查看 `README.md`

### 测试登录

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"name":"admin","password":"admin"}'
```

## 默认账号

- 用户名：`admin`
- 密码：`admin`

**⚠️ 重要：生产环境请立即修改管理员密码！**

## 常见问题

### 数据库文件未创建

1. 确保 `backend/data` 目录有写入权限
2. 运行 `npm run migrate` 初始化数据库
3. 检查控制台错误信息

### 迁移失败

1. 检查 `backend/data` 目录权限
2. 确保磁盘空间充足
3. 查看错误日志

### 端口被占用

修改 `.env` 中的 `PORT` 配置

### 数据库文件位置

- 数据库文件：`backend/data/amazongen.json`
- 备份：直接复制该文件即可
- 重置：删除该文件后重新运行 `npm run migrate`

