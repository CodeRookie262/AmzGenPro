# 环境变量配置说明

请创建 `.env` 文件并配置以下变量：

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# JWT Configuration
JWT_SECRET=amazongen-super-secret-key-2024-change-in-production
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# File Upload Configuration
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
```

## 重要提示

1. **本地数据库**：项目使用本地 JSON 数据库，无需配置 MySQL
2. **数据库文件位置**：`backend/data/amazongen.json`（自动创建）
3. **JWT_SECRET**：生产环境请务必修改为强密码
4. **CORS_ORIGIN**：根据前端实际地址修改

## 首次运行

1. 初始化数据库（可选，迁移脚本会自动创建）：
```bash
npm run init-db
```

2. 运行迁移（创建表结构和默认管理员账号）：
```bash
npm run migrate
```

3. 启动服务：
```bash
npm run dev
```

## 数据库说明

- **类型**：本地 JSON 数据库（lowdb）
- **文件位置**：`backend/data/amazongen.json`
- **优势**：无需安装和配置数据库服务器，开箱即用
- **备份**：直接复制 `amazongen.json` 文件即可

