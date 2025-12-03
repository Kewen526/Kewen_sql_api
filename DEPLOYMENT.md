# 🚀 Docker 部署指南

## 📋 部署准备

### 1. 服务器要求
- Docker 已安装
- Docker Compose 已安装
- 开放端口：3000（可修改）

---

## 🔧 快速部署步骤

### 步骤 1：上传代码到服务器

在服务器上克隆代码：

```bash
# 克隆仓库
git clone https://github.com/Kewen526/Kewen_sql_api.git

# 进入目录
cd Kewen_sql_api

# 切换到工作分支
git checkout claude/migrate-dbapi-to-server-01Jbc9U35X2xZhkrjJswf4sK
```

或者使用 `scp` 上传整个文件夹到服务器。

---

### 步骤 2：配置环境变量

`.env` 文件已经配置好，但你可以根据需要修改端口：

```bash
# 编辑 .env 文件
vim .env

# 修改端口（可选）
PORT=3000  # 改成你想要的端口，比如 8080
```

**当前配置：**
```env
PORT=3000
HOST=0.0.0.0

# 数据源已配置好
DB1_HOST=rm-j6ce98dcz1z47ee42so.mysql.rds.aliyuncs.com
DB1_USER=gocrm
DB1_PASSWORD=4ijmvv7U
DB1_DATABASE=gocrm

DB2_HOST=47.104.72.198
DB2_USER=root
DB2_PASSWORD=Kewen888@
DB2_DATABASE=purchase_iw

DB3_HOST=47.104.72.198
DB3_USER=root
DB3_PASSWORD=Kewen888@
DB3_DATABASE=order_tracking_iw
```

---

### 步骤 3：使用 Docker Compose 部署

**一键启动：**

```bash
# 构建并启动容器（后台运行）
docker-compose up -d --build
```

**查看运行状态：**

```bash
# 查看容器状态
docker-compose ps

# 查看实时日志
docker-compose logs -f

# 查看最近 100 行日志
docker-compose logs --tail=100
```

---

### 步骤 4：验证部署

```bash
# 健康检查
curl http://localhost:3000/health

# 或使用服务器IP
curl http://YOUR_SERVER_IP:3000/health
```

**预期响应：**
```json
{
  "status": "healthy",
  "timestamp": "2025-12-03T10:00:00.000Z",
  "uptime": 120,
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

---

## 🎯 API 访问

所有 111 个 API 已自动注册，访问方式：

```bash
# 基础 URL
http://YOUR_SERVER_IP:3000

# 示例 1：获取产品详情
curl -X POST http://YOUR_SERVER_IP:3000/get_product_info \
  -H "Content-Type: application/json" \
  -d '{"id": "455226"}'

# 示例 2：获取订单详情
curl -X POST http://YOUR_SERVER_IP:3000/order \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d 'order_id=QXL-B-123456'

# 示例 3：获取采购任务
curl -X POST http://YOUR_SERVER_IP:3000/get_purchase_iw_task \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d 'conductor=1'
```

**API 路径完全保持原样！** 所有路径都是从 `api_config (1).json` 自动读取的。

---

## 🔄 常用 Docker 命令

### 停止服务
```bash
docker-compose down
```

### 重启服务
```bash
docker-compose restart
```

### 更新代码后重新部署
```bash
# 拉取最新代码
git pull origin claude/migrate-dbapi-to-server-01Jbc9U35X2xZhkrjJswf4sK

# 重新构建并启动
docker-compose up -d --build
```

### 查看容器资源占用
```bash
docker stats kewen-sql-api
```

### 进入容器内部（调试用）
```bash
docker exec -it kewen-sql-api sh
```

### 清理旧镜像
```bash
docker system prune -a
```

---

## 📊 性能配置

### 修改内存限制

编辑 `docker-compose.yml`：

```yaml
deploy:
  resources:
    limits:
      memory: 512M  # 修改为你需要的内存
```

### 修改端口映射

编辑 `docker-compose.yml`：

```yaml
ports:
  - "8080:3000"  # 左边是外部端口，右边是容器内端口
```

或者在 `.env` 文件中修改：

```env
PORT=8080
```

然后重新部署：
```bash
docker-compose up -d --build
```

---

## 🔒 Nginx 反向代理（可选）

如果你想使用域名或 HTTPS，可以配置 Nginx：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🐛 故障排查

### 1. 容器无法启动

查看错误日志：
```bash
docker-compose logs
```

### 2. 数据库连接失败

检查网络连接：
```bash
# 进入容器
docker exec -it kewen-sql-api sh

# 测试数据库连接
nc -zv 47.104.72.198 3306
```

### 3. 端口被占用

修改 `.env` 中的 `PORT`，或修改 `docker-compose.yml` 的端口映射。

### 4. 查看详细日志

```bash
# 查看所有日志
docker-compose logs --tail=1000

# 只看错误日志
docker-compose logs | grep -i error
```

---

## 📝 完整部署命令（复制粘贴）

```bash
# 1. 克隆代码
git clone https://github.com/Kewen526/Kewen_sql_api.git
cd Kewen_sql_api
git checkout claude/migrate-dbapi-to-server-01Jbc9U35X2xZhkrjJswf4sK

# 2. 启动服务（一键部署）
docker-compose up -d --build

# 3. 查看日志
docker-compose logs -f

# 4. 验证服务
curl http://localhost:3000/health

# 完成！🎉
```

---

## 🔄 添加新 API

1. 编辑 `api_config (1).json` 添加新接口
2. 重启容器：
```bash
docker-compose restart
```

新接口立即生效！

---

## 📈 监控建议

- 使用 `docker stats` 监控资源占用
- 定期检查 `/health` 端点
- 配置日志轮转避免磁盘占满
- 建议使用 Portainer 可视化管理 Docker

---

**部署完成后，API 地址：** `http://YOUR_SERVER_IP:3000`

所有 111 个 API 路径保持不变！ ✅
