# 调试 404 错误

## 问题：前端调用登录接口返回 404

### 路由配置检查

✅ 路由配置是正确的：
- 后端：`/api/auth/login` (POST)
- 前端调用：`/auth/login` (相对于 baseURL `http://localhost:3001/api`)
- 完整 URL：`http://localhost:3001/api/auth/login` ✓

### 排查步骤

#### 1. 确认后端服务器正在运行

```bash
cd backend
npm run dev
```

应该看到：
```
🚀 Server running on http://localhost:3001
📊 Environment: development
🔗 API endpoint: http://localhost:3001/api
📁 Database: backend/data/amazongen.json
```

#### 2. 测试健康检查端点

在浏览器或使用 curl：
```bash
curl http://localhost:3001/health
```

应该返回：
```json
{"status":"ok","timestamp":"..."}
```

#### 3. 测试登录接口

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"admin\",\"password\":\"admin\"}"
```

#### 4. 检查前端 API 配置

确认前端 `.env` 文件（如果存在）或环境变量：
```env
VITE_API_BASE_URL=http://localhost:3001/api
```

或者检查浏览器控制台，查看实际请求的 URL。

#### 5. 查看后端日志

后端现在会记录所有请求：
```
[2024-01-01T00:00:00.000Z] POST /api/auth/login
```

如果看到 `404 - Route not found`，说明路由没有正确注册。

### 常见问题

#### 问题 1: 端口被占用
如果 3001 端口被占用，后端会自动使用其他端口，但前端仍会请求 3001。

**解决方案**：
1. 修改后端 `.env` 文件：
   ```env
   PORT=3001
   ```
2. 或者修改前端环境变量：
   ```env
   VITE_API_BASE_URL=http://localhost:<实际端口>/api
   ```

#### 问题 2: CORS 错误
如果看到 CORS 错误而不是 404，检查后端 `.env`：
```env
CORS_ORIGIN=http://localhost:3000
```

#### 问题 3: 数据库未初始化
确保已运行迁移：
```bash
cd backend
npm run migrate
```

### 调试技巧

1. **查看浏览器网络面板**：
   - 打开开发者工具 (F12)
   - 切换到 Network 标签
   - 尝试登录
   - 查看请求的 URL 和响应状态码

2. **查看后端控制台**：
   - 所有请求都会记录
   - 查看是否有错误信息

3. **测试其他端点**：
   ```bash
   # 健康检查
   curl http://localhost:3001/health
   
   # 登录
   curl -X POST http://localhost:3001/api/auth/login \
     -H "Content-Type: application/json" \
     -d "{\"name\":\"admin\",\"password\":\"admin\"}"
   ```


