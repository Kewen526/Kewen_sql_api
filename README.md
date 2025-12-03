# Kewen SQL API Server

🚀 **高性能、低内存的 SQL API 服务器**

替代 DBAPI，支持从配置文件自动生成 111 个 API 接口。

---

## 📋 特性

- ⚡ **高性能**: 基于 Fastify，比 Express 快 2-3 倍
- 💾 **低内存**: 优化的连接池和内存管理，内存占用 < 100MB
- 🔒 **安全**: 参数化查询防止 SQL 注入
- 🔄 **事务支持**: 完整的数据库事务管理
- 🌐 **高并发**: 支持连接池和集群模式
- 📝 **自动路由**: 从配置文件自动生成所有 API
- 🎯 **MyBatis 语法**: 支持 `#{param}` 占位符和 `<foreach>` 标签
- 📊 **健康检查**: 内置监控和状态检查

---

## 🏗️ 项目结构

```
Kewen_sql_api/
├── src/
│   ├── database/
│   │   ├── pool.js          # 数据库连接池管理
│   │   ├── executor.js      # SQL 执行器（支持事务）
│   │   └── queryParser.js   # 参数化查询解析器
│   ├── routes/
│   │   ├── autoRoutes.js    # 自动路由生成器
│   │   └── systemRoutes.js  # 系统路由（健康检查等）
│   └── server.js            # 主服务器文件
├── api_config (1).json      # API 配置文件（111个接口）
├── .env.example             # 环境变量示例
├── package.json
├── ecosystem.config.cjs     # PM2 配置
├── Dockerfile               # Docker 配置
└── docker-compose.yml       # Docker Compose 配置
```

---

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env`，然后填写数据库连接信息：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
# 服务器配置
PORT=3000
HOST=0.0.0.0

# 数据源1 (YYKtG9Dv - 产品/订单库)
DB1_HOST=your_db_host
DB1_PORT=3306
DB1_USER=your_username
DB1_PASSWORD=your_password
DB1_DATABASE=product_db
DB1_POOL_MIN=2
DB1_POOL_MAX=10

# 数据源2 (ukG1SAgu - 采购库)
DB2_HOST=your_db_host
DB2_PORT=3306
DB2_USER=your_username
DB2_PASSWORD=your_password
DB2_DATABASE=purchase_db
DB2_POOL_MIN=2
DB2_POOL_MAX=10

# 数据源3 (q45gsAZj - 任务库)
DB3_HOST=your_db_host
DB3_PORT=3306
DB3_USER=your_username
DB3_PASSWORD=your_password
DB3_DATABASE=task_db
DB3_POOL_MIN=2
DB3_POOL_MAX=10
```

### 3. 启动服务器

**开发模式：**
```bash
npm run dev
```

**生产模式：**
```bash
npm start
```

### 4. 验证服务

访问健康检查接口：
```bash
curl http://localhost:3000/health
```

---

## 🐳 Docker 部署

### 使用 Docker Compose（推荐）

```bash
# 构建并启动
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### 使用 Docker

```bash
# 构建镜像
docker build -t kewen-sql-api .

# 运行容器
docker run -d \
  --name kewen-sql-api \
  --env-file .env \
  -p 3000:3000 \
  kewen-sql-api
```

---

## 📦 PM2 部署（生产环境推荐）

PM2 提供进程管理、自动重启、负载均衡等功能。

### 启动服务

```bash
npm run pm2:start
```

### 其他命令

```bash
# 停止服务
npm run pm2:stop

# 重启服务
npm run pm2:restart

# 查看日志
npm run pm2:logs

# 查看状态
pm2 status

# 查看监控
pm2 monit
```

---

## 📊 API 接口

服务器会自动从 `api_config (1).json` 生成 **111 个 API 接口**。

### 示例接口

#### 1. 获取产品详情
```bash
POST /get_product_info
Content-Type: application/json

{
  "id": "455226"
}
```

#### 2. 获取订单详情
```bash
POST /order?order_id=QXL-B-123456
```

#### 3. 修改店铺信息
```bash
POST /shop/update
Content-Type: application/json

{
  "id": "123",
  "customer_id": "456",
  "shop_rate": 0.15
}
```

### 响应格式

**成功响应：**
```json
{
  "success": true,
  "data": {
    "id": "455226",
    "name": "产品名称",
    ...
  }
}
```

**错误响应：**
```json
{
  "success": false,
  "error": "ParameterValidationError",
  "message": "参数验证失败",
  "details": ["缺少必填参数: id"]
}
```

---

## 🛠️ 添加新接口

只需在 `api_config (1).json` 中添加新的 API 配置，然后重启服务器即可。

### 配置示例

```json
{
  "id": "newApi001",
  "name": "新接口名称",
  "path": "api/new-endpoint",
  "contentType": "application/json",
  "params": "[{\"name\":\"userId\",\"type\":\"string\"}]",
  "task": "[{
    \"taskType\":1,
    \"datasourceId\":\"YYKtG9Dv\",
    \"sqlList\":[{
      \"sqlText\":\"SELECT * FROM users WHERE id = #{userId}\"
    }],
    \"transaction\":0
  }]",
  "status": 1
}
```

**重启服务器：**
```bash
pm2 restart kewen-sql-api
# 或
docker-compose restart
```

---

## 📈 性能优化

### 1. 连接池配置

根据服务器负载调整连接池大小（在 `.env` 中）：

```env
# 低流量：2-10 连接
DB1_POOL_MIN=2
DB1_POOL_MAX=10

# 高流量：5-50 连接
DB1_POOL_MIN=5
DB1_POOL_MAX=50
```

### 2. PM2 集群模式

在 `ecosystem.config.cjs` 中调整实例数量：

```javascript
instances: 'max', // 使用所有 CPU 核心
// 或
instances: 4,     // 固定 4 个实例
```

### 3. 内存限制

PM2 会在内存超过 300MB 时自动重启进程（可在 `ecosystem.config.cjs` 中调整）。

---

## 🔍 监控和日志

### 健康检查

```bash
curl http://localhost:3000/health
```

返回：
```json
{
  "status": "healthy",
  "timestamp": "2025-12-03T10:00:00.000Z",
  "uptime": 3600,
  "memory": {
    "used": 85,
    "total": 120,
    "rss": 150
  },
  "database": {
    "YYKtG9Dv": {
      "totalConnections": 10,
      "freeConnections": 8,
      "queueLength": 0
    }
  }
}
```

### 查看日志

**PM2 日志：**
```bash
pm2 logs kewen-sql-api
```

**Docker 日志：**
```bash
docker-compose logs -f
```

---

## 🔒 安全建议

1. **生产环境** 请限制 CORS 来源（修改 `src/server.js`）
2. **数据库密码** 使用强密码并定期更换
3. **防火墙** 只开放必要的端口（3000）
4. **HTTPS** 使用 Nginx 反向代理并配置 SSL 证书
5. **日志** 定期检查错误日志，及时发现异常

---

## 🐛 常见问题

### 1. 连接数据库失败

检查：
- 数据库服务是否运行
- `.env` 中的连接信息是否正确
- 防火墙是否允许连接

### 2. 内存占用过高

- 减少连接池大小（`DB*_POOL_MAX`）
- 减少 PM2 实例数量
- 检查是否有慢查询

### 3. API 接口返回 404

- 检查 `api_config (1).json` 中的 `status` 是否为 `1`
- 检查路径是否正确
- 查看服务器启动日志确认路由是否注册成功

---

## 📝 技术栈

- **Node.js** v18+
- **Fastify** - 高性能 Web 框架
- **MySQL2** - MySQL 客户端（连接池）
- **PM2** - 进程管理器
- **Docker** - 容器化部署

---

## 📄 许可证

MIT License

---

## 🤝 支持

如有问题，请查看日志或联系开发团队。
