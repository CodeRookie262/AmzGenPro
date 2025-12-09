# AmazonGen Backend API

AmazonGen 后端 API 服务，提供用户管理、面具管理、生成历史等功能。

## 技术栈

- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: 本地 JSON 数据库（lowdb）
- **Authentication**: JWT
- **Password Hashing**: bcryptjs

## 快速开始

### 1. 安装依赖

```bash
cd backend
npm install
```

### 2. 配置环境变量

创建 `.env` 文件（参考 `ENV_SETUP.md`）：

```env
PORT=3001
NODE_ENV=development
JWT_SECRET=amazongen-super-secret-key-2024-change-in-production
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
```

**注意**：项目使用本地 JSON 数据库，无需配置 MySQL。

### 3. 初始化数据库

运行迁移脚本创建数据库文件并初始化数据：

```bash
npm run migrate
```

这将自动创建 `backend/data/amazongen.json` 数据库文件。

### 4. 启动服务

开发模式（热重载）：
```bash
npm run dev
```

生产模式：
```bash
npm run build
npm start
```

## API 文档

### 认证接口

#### POST `/api/auth/login`
用户登录

**请求体：**
```json
{
  "name": "admin",
  "password": "admin"
}
```

**响应：**
```json
{
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "name": "admin",
    "role": "admin",
    "avatar": "👑",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### POST `/api/auth/register`
注册新用户（需要管理员权限）

### 用户管理接口

所有接口需要认证（Bearer Token）

#### GET `/api/users/me`
获取当前用户信息

#### GET `/api/users`
获取所有用户列表（仅管理员）

#### POST `/api/users`
创建新用户（仅管理员）

**请求体：**
```json
{
  "name": "newuser",
  "password": "password123",
  "role": "user"
}
```

#### DELETE `/api/users/:userId`
删除用户（仅管理员）

### 面具管理接口

#### GET `/api/masks`
获取所有公共面具

#### POST `/api/masks`
创建新面具（仅管理员）

**请求体：**
```json
{
  "name": "产品面具名称",
  "promptModel": "gemini-2.5-flash",
  "definitions": [
    {
      "name": "白底主图",
      "prompt": "专业电商白底图，展示产品全貌"
    }
  ]
}
```

#### PUT `/api/masks/:maskId`
更新面具信息（仅管理员）

#### DELETE `/api/masks/:maskId`
删除面具（仅管理员）

#### POST `/api/masks/:maskId/definitions`
添加镜头定义（仅管理员）

#### PUT `/api/masks/definitions/:definitionId`
更新镜头定义（仅管理员）

#### DELETE `/api/masks/definitions/:definitionId`
删除镜头定义（仅管理员）

### 生成历史接口

#### GET `/api/history`
获取当前用户的生成历史

**查询参数：**
- `page`: 页码（默认 1）
- `limit`: 每页数量（默认 50）

#### POST `/api/history`
创建生成历史记录

**请求体：**
```json
{
  "maskId": "mask-id",
  "definitionId": "def-id",
  "definitionName": "白底主图",
  "sourceImageUrl": "https://...",
  "generatedImageUrl": "https://...",
  "prompt": "原始提示词",
  "optimizedPrompt": "优化后的提示词",
  "model": "gemini-2.5-flash-image"
}
```

#### DELETE `/api/history/:historyId`
删除历史记录

### API Key 管理接口

#### GET `/api/api-keys`
获取当前用户的 API Keys

#### PUT `/api/api-keys`
更新当前用户的 API Keys

**请求体：**
```json
{
  "google": "AIzaSy...",
  "openRouter": "sk-or-v1-..."
}
```

## 数据库结构

### 表说明

- **users**: 用户表
- **product_masks**: 产品面具表（公共配置）
- **image_definitions**: 镜头定义表
- **generation_history**: 生成历史表
- **api_keys**: API Key 配置表（用户级别）

### 数据库文件

- **位置**：`backend/data/amazongen.json`
- **类型**：本地 JSON 数据库（lowdb）
- **备份**：直接复制 `amazongen.json` 文件即可
- **重置**：删除该文件后重新运行 `npm run migrate`

## 认证说明

所有需要认证的接口需要在请求头中添加：

```
Authorization: Bearer <jwt-token>
```

Token 通过登录接口获取，默认有效期 7 天。

## 部署

### 生产环境配置

1. 修改 `.env` 中的配置
2. 设置强密码的 `JWT_SECRET`
3. 配置正确的 `CORS_ORIGIN`
4. 使用 PM2 或类似工具管理进程

```bash
npm run build
pm2 start dist/index.js --name amazongen-api
```

## 注意事项

- 默认管理员账号：`admin` / `admin`
- 首次部署后请立即修改管理员密码
- API Keys 存储在数据库中，建议加密存储敏感信息
- 图片文件建议使用对象存储服务（OSS/S3）

