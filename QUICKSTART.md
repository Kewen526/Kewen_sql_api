# ⚡ 快速开始 - 服务器部署

## 📦 方法一：一键部署（推荐）

```bash
# 1. 上传代码到服务器或克隆仓库
git clone https://github.com/Kewen526/Kewen_sql_api.git
cd Kewen_sql_api
git checkout claude/migrate-dbapi-to-server-01Jbc9U35X2xZhkrjJswf4sK

# 2. 运行部署脚本
./deploy.sh

# 完成！🎉
```

---

## 📦 方法二：手动 Docker 部署

```bash
# 1. 构建并启动
docker-compose up -d --build

# 2. 查看日志
docker-compose logs -f

# 3. 验证服务
curl http://localhost:3000/health
```

---

## 🌐 API 访问

**服务地址：** `http://YOUR_SERVER_IP:3000`

**所有 API 路径保持不变！** 直接替换原来的 DBAPI 地址即可。

### 示例

```bash
# 原来的 DBAPI 地址
http://old-dbapi-server.com/get_product_info

# 新的服务器地址（只改IP和端口）
http://YOUR_SERVER_IP:3000/get_product_info
```

---

## 📋 API 列表（111个）

所有接口都已自动生成，包括：

### 产品相关（43个）
- `/get_product_info` - 获取产品详情
- `/product-attributes` - 获取产品属性
- `/product_id_special_pairing` - 特殊配对信息
- `/offer_remark` - 报价备注
- `/shop/update` - 修改店铺信息
- ...

### 采购相关（41个）
- `/get_purchase_iw_task` - 获取采购任务
- `/get_payment_task` - 获取付款任务
- `/get_place_order_task` - 获取下单任务
- `/purchase_orders` - 采购单管理
- ...

### 任务相关（27个）
- `/get_sku` - 获取SKU任务
- `/task_status` - 任务状态管理
- `/get_transfer_order_task` - 移仓任务
- ...

**完整列表见启动日志**

---

## 🔧 常用命令

```bash
# 查看容器状态
docker-compose ps

# 查看实时日志
docker-compose logs -f

# 重启服务
docker-compose restart

# 停止服务
docker-compose down

# 查看资源占用
docker stats kewen-sql-api

# 进入容器（调试）
docker exec -it kewen-sql-api sh
```

---

## 🔄 修改配置

### 修改端口

编辑 `.env` 文件：
```env
PORT=8080  # 改成你想要的端口
```

然后重启：
```bash
docker-compose restart
```

### 修改数据库连接

编辑 `.env` 文件中的数据库配置，然后重启服务。

---

## 📊 监控

```bash
# 健康检查
curl http://localhost:3000/health

# 查看内存占用
docker stats kewen-sql-api --no-stream

# 查看最近错误
docker-compose logs | grep -i error
```

---

## 🆕 添加新 API

1. 编辑 `api_config (1).json` 添加新接口配置
2. 重启服务：`docker-compose restart`
3. 新接口立即生效！

---

## ✅ 验证部署

```bash
# 1. 健康检查
curl http://localhost:3000/health

# 2. 测试产品接口
curl -X POST http://localhost:3000/get_product_info \
  -H "Content-Type: application/json" \
  -d '{"id": "455226"}'

# 3. 测试采购接口
curl -X POST http://localhost:3000/get_purchase_iw_task \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d 'conductor=1'
```

---

## 🚨 故障排查

### 服务无法启动
```bash
# 查看详细日志
docker-compose logs

# 检查端口占用
netstat -tulpn | grep 3000
```

### 数据库连接失败
```bash
# 进入容器测试连接
docker exec -it kewen-sql-api sh
nc -zv 47.104.72.198 3306
```

### 重置服务
```bash
# 完全重置
docker-compose down
docker system prune -a
./deploy.sh
```

---

## 📞 支持

详细文档：
- `README.md` - 完整功能说明
- `DEPLOYMENT.md` - 详细部署指南

---

**🎯 关键点：**
1. ✅ API 路径完全不变
2. ✅ 只需修改 IP 和端口
3. ✅ 支持 111 个接口
4. ✅ 自动事务管理
5. ✅ 低内存高并发
