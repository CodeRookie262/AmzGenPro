# 启动后端服务

## ✅ 数据库已创建

数据库文件位置：`backend/data/amazongen.json`

默认管理员账号已创建：
- 用户名：`admin`
- 密码：`admin`

## 启动服务

```bash
cd backend
npm run dev
```

服务将在 `http://localhost:3002` 启动（如果 3001 被占用）

## 测试 API

### 健康检查
```bash
curl http://localhost:3002/health
```

### 测试登录
```bash
curl -X POST http://localhost:3002/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"admin\",\"password\":\"admin\"}"
```

## 数据库文件

数据库使用 JSON 文件存储，位置：`backend/data/amazongen.json`

可以直接查看和编辑这个文件（不推荐手动编辑）

## 优势

✅ 无需 MySQL 服务器
✅ 数据库文件就在项目中
✅ 方便备份（直接复制 JSON 文件）
✅ 无需配置数据库连接





