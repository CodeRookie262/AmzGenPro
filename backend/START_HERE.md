# 后端服务启动说明

## ✅ 使用本地 JSON 数据库

项目使用本地 JSON 数据库，无需安装和配置 MySQL 服务器。

## 步骤 1: 运行数据库迁移

```bash
cd backend
npm run migrate
```

这将：
- 自动创建 `backend/data/amazongen.json` 数据库文件
- 创建所有必要的表结构
- 插入默认管理员账号（admin/admin）

## 步骤 2: 启动后端服务

```bash
npm run dev
```

服务将在 `http://localhost:3002` 启动（因为 3001 被前端占用）

## 步骤 3: 更新前端配置

修改项目根目录的 `.env` 文件：

```env
VITE_API_BASE_URL=http://localhost:3002/api
```

## 测试服务

服务启动后，访问：
- 健康检查：http://localhost:3002/health
- API 端点：http://localhost:3002/api

### 测试登录

```bash
curl -X POST http://localhost:3002/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"admin\",\"password\":\"admin\"}"
```

## 默认账号

- 用户名：`admin`
- 密码：`admin`

## 当前状态

✅ 依赖已安装
✅ 代码已就绪
✅ 使用本地 JSON 数据库（无需 MySQL）
⏳ 等待迁移执行
⏳ 等待服务启动

## 数据库说明

- **数据库文件**：`backend/data/amazongen.json`
- **类型**：本地 JSON 数据库（lowdb）
- **优势**：无需安装数据库服务器，开箱即用
- **备份**：直接复制 `amazongen.json` 文件即可

## 故障排查

### 数据库文件未创建
- 确保 `backend/data` 目录有写入权限
- 运行 `npm run migrate` 初始化数据库
- 检查控制台错误信息

### 端口冲突
- 后端默认使用 3002 端口（3001 被前端占用）
- 可在 `.env` 中修改 `PORT` 配置

### 迁移失败
- 检查 `backend/data` 目录权限
- 确保磁盘空间充足
- 查看错误日志

