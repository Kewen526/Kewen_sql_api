# 📚 部署文档服务到 3001 端口

## 🚀 快速部署

在你的服务器上运行以下命令：

```bash
# 1. 进入项目目录
cd /opt/kewen-sql-api

# 2. 确保已安装依赖
npm install

# 3. 启动文档服务器（前台运行）
npm run docs:serve
```

服务会启动在 3001 端口，访问: **http://47.104.72.198:3001**

---

## 🔥 后台运行（推荐）

使用 PM2 后台运行文档服务器：

```bash
# 启动文档服务器
pm2 start docs-server.js --name api-docs

# 查看状态
pm2 status

# 查看日志
pm2 logs api-docs

# 停止服务
pm2 stop api-docs

# 重启服务
pm2 restart api-docs
```

---

## 🌐 访问地址

- **文档地址**: http://47.104.72.198:3001
- **API 地址**: http://47.104.72.198:3000

---

## ⚠️ 开放端口

在阿里云控制台开放 3001 端口：

1. 登录阿里云控制台
2. 进入 ECS 实例
3. 安全组 → 配置规则
4. 添加入方向规则：
   - 端口范围: 3001/3001
   - 授权对象: 0.0.0.0/0
   - 描述: API文档服务器

---

## 🔄 更新文档

修改 API 配置后，重新生成文档：

```bash
cd /opt/kewen-sql-api

# 重新生成文档
npm run docs:generate

# 如果使用 PM2，重启文档服务器
pm2 restart api-docs
```

---

## ✅ 验证

```bash
# 检查服务是否运行
curl http://localhost:3001

# 或
curl http://47.104.72.198:3001
```

访问成功会看到HTML页面！
