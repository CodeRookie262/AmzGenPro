# 前后端集成指南

## 概述

前端已完全集成后端 API，所有数据操作都通过 RESTful API 进行。

## 环境配置

### 1. 前端环境变量

创建 `.env` 文件（或使用 `.env.example`）：

```env
VITE_API_BASE_URL=http://localhost:3001/api
```

### 2. 后端环境变量

后端 `.env` 文件已配置数据库连接信息。

## 启动步骤

### 1. 启动后端服务

```bash
cd backend
npm install
npm run migrate  # 首次运行需要初始化数据库
npm run dev      # 开发模式
```

后端服务将在 `http://localhost:3001` 启动。

### 2. 启动前端服务

```bash
# 在项目根目录
npm install
npm run dev
```

前端服务将在 `http://localhost:3000` 启动。

## API 集成说明

### 认证流程

1. **登录**：`POST /api/auth/login`
   - 返回 JWT token
   - Token 自动存储在 localStorage
   - 后续请求自动携带 token

2. **自动认证**：
   - 页面刷新时自动验证 token
   - Token 过期自动跳转登录页

### 数据流

#### 用户管理
- ✅ 登录/注册 → `backendAuth.login()`
- ✅ 获取当前用户 → `backendAuth.getCurrentUser()`
- ✅ 用户列表 → `backendUsers.getUsers()`
- ✅ 创建用户 → `backendUsers.createUser()`
- ✅ 删除用户 → `backendUsers.deleteUser()`

#### 面具管理
- ✅ 获取面具列表 → `backendMasks.getMasks()`
- ✅ 创建面具 → `backendMasks.createMask()`
- ✅ 更新面具 → `backendMasks.updateMask()`
- ✅ 删除面具 → `backendMasks.deleteMask()`
- ✅ 添加镜头定义 → `backendMasks.addDefinition()`
- ✅ 更新镜头定义 → `backendMasks.updateDefinition()`
- ✅ 删除镜头定义 → `backendMasks.deleteDefinition()`

#### 生成历史
- ✅ 获取历史记录 → `backendHistory.getHistory()`
- ✅ 创建历史记录 → `backendHistory.createHistory()`
- ✅ 删除历史记录 → `backendHistory.deleteHistory()`

#### API Keys
- ✅ 获取 API Keys → `backendApiKeys.getApiKeys()`
- ✅ 更新 API Keys → `backendApiKeys.updateApiKeys()`

## 主要变更

### 1. 服务层重构

- **新增** `services/apiService.ts`：统一的 API 客户端
- **新增** `services/backendService.ts`：后端服务封装
- **保留** `services/storageService.ts`：仅用于 API Keys 的本地缓存（可选）

### 2. 组件更新

- **LoginPanel**：使用 `backendAuth.login()`
- **App**：使用 `backendAuth.getCurrentUser()` 和 `backendAuth.logout()`
- **AdminPanel**：所有操作使用后端 API
- **UserPanel**：面具和历史记录使用后端 API

### 3. 数据存储

- ✅ 用户数据 → MySQL 数据库
- ✅ 面具配置 → MySQL 数据库
- ✅ 生成历史 → MySQL 数据库
- ✅ API Keys → MySQL 数据库（用户级别）

## 错误处理

所有 API 调用都包含错误处理：

```typescript
try {
  const data = await backendMasks.getMasks();
  // 处理成功
} catch (error: any) {
  alert('操作失败: ' + (error.message || '未知错误'));
}
```

## 开发注意事项

1. **CORS**：确保后端 CORS 配置允许前端域名
2. **Token 过期**：401 错误会自动清除 token 并跳转登录
3. **网络错误**：所有 API 调用都有错误处理
4. **加载状态**：组件中已添加 loading 状态处理

## 测试

### 测试登录

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"name":"admin","password":"admin"}'
```

### 测试获取面具

```bash
curl -X GET http://localhost:3001/api/masks \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 故障排查

1. **无法连接后端**：
   - 检查后端服务是否启动
   - 检查 `VITE_API_BASE_URL` 配置
   - 检查 CORS 设置

2. **401 Unauthorized**：
   - Token 可能已过期，重新登录
   - 检查 token 是否正确传递

3. **数据库连接失败**：
   - 检查后端 `.env` 配置
   - 确认数据库服务可访问
   - 检查防火墙设置

## 下一步

- [ ] 添加图片上传功能（如果需要）
- [ ] 实现图片存储（OSS/S3）
- [ ] 添加实时通知功能
- [ ] 性能优化和缓存策略



