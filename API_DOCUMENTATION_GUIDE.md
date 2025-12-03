# 📚 API 文档使用指南

## 🎉 已生成完整的 API 文档

你的 API 文档已经生成完成，包含所有 **111 个接口**的详细说明！

---

## 📁 文档文件

- **`API_DOCS.html`** - 完整的 API 文档（可以用浏览器打开）
- **`generate-docs.cjs`** - 文档生成脚本
- **`docs-server.js`** - 文档服务器（可选）

---

## 🌐 方式一：直接打开 HTML 文件（最简单）

### 在本地查看

1. 找到 `API_DOCS.html` 文件
2. 双击用浏览器打开
3. 开始使用！

### 在服务器上部署

```bash
# 1. 上传 API_DOCS.html 到服务器
scp API_DOCS.html root@YOUR_SERVER_IP:/var/www/html/

# 2. 使用 Nginx 或 Apache 提供访问
# 访问: http://YOUR_SERVER_IP/API_DOCS.html
```

---

## 🚀 方式二：运行文档服务器（推荐）

### 在服务器上运行

```bash
# 1. 进入项目目录
cd /opt/kewen-sql-api

# 2. 安装 express（如果还没安装）
npm install

# 3. 启动文档服务器
npm run docs:serve
```

### 访问文档

- **内网访问**: http://localhost:3001
- **外网访问**: http://YOUR_SERVER_IP:3001

### 后台运行（使用 PM2）

```bash
# 后台运行文档服务器
pm2 start docs-server.js --name api-docs

# 查看状态
pm2 status

# 查看日志
pm2 logs api-docs

# 停止服务
pm2 stop api-docs
```

---

## 🔄 更新文档

当你修改了 `api_config (1).json` 后，重新生成文档：

```bash
# 生成新文档
npm run docs:generate

# 如果文档服务器正在运行，刷新浏览器即可看到更新
```

---

## ✨ 文档特性

### 📋 完整信息

每个接口都包含：
- ✅ 接口名称和说明
- ✅ 完整的 API 地址
- ✅ HTTP 方法（GET/POST）
- ✅ Content-Type
- ✅ 请求参数详情（参数名、类型、说明）
- ✅ 请求示例数据
- ✅ cURL 命令（可一键复制）
- ✅ 响应示例（成功和失败）
- ✅ 事务标识

### 🔍 强大的搜索功能

- 支持按接口名称搜索
- 支持按路径搜索
- 支持按功能描述搜索
- 实时过滤结果

### 📱 响应式设计

- 支持桌面和移动设备
- 清晰的分组展示
- 优雅的交互效果

### 📋 一键复制

- 复制 API 地址
- 复制 cURL 命令
- 快速测试接口

---

## 🎯 文档展示截图

文档包含以下分组：

### 产品相关 (43 个接口)
- 获取产品详情
- 产品属性管理
- 报价管理
- 店铺管理
- ...

### 采购相关 (41 个接口)
- 采购任务管理
- 付款任务
- 下单任务
- 订单管理
- ...

### 任务相关 (27 个接口)
- SKU 任务
- 移仓任务
- 发票管理
- 任务状态
- ...

---

## 💡 使用技巧

### 1. 快速定位接口

使用搜索框，输入关键词即可快速找到需要的接口：
- 输入 "product" 查找产品相关接口
- 输入 "order" 查找订单相关接口
- 输入 "task" 查找任务相关接口

### 2. 测试接口

点击任意接口展开详情，复制 cURL 命令，然后在终端执行：

```bash
# 示例：测试获取产品详情
curl -X POST http://YOUR_SERVER_IP:3000/get_product_info \
  -H "Content-Type: application/json" \
  -d '{"id": "455226"}'
```

### 3. 分享给团队

将文档部署到服务器后，团队成员可以通过浏览器访问，无需安装任何软件。

---

## 🔧 与 DBAPI 的对比

| 特性 | DBAPI | Kewen SQL API |
|------|-------|---------------|
| **界面** | Web 管理界面 | 静态 HTML 文档 |
| **路径** | 完全相同 | ✅ 完全相同 |
| **参数** | 完全相同 | ✅ 完全相同 |
| **功能** | 完全相同 | ✅ 完全相同 |
| **性能** | 标准 | ⚡ 更快 |
| **内存** | 标准 | 💾 更低 |
| **部署** | 依赖 DBAPI | ✅ 独立部署 |

---

## 🌐 访问地址对比

### 原 DBAPI 地址
```
http://old-dbapi-server.com/get_product_info
```

### 新服务器地址
```
http://YOUR_SERVER_IP:3000/get_product_info
```

**只需替换域名和端口，路径完全一致！**

---

## 📞 支持

如果你需要：
- 添加新的 API 接口
- 修改现有接口
- 自定义文档样式

只需：
1. 修改 `api_config (1).json`
2. 运行 `npm run docs:generate`
3. 刷新文档页面

---

## 🎨 自定义文档

如果你想修改文档的外观，可以编辑 `generate-docs.cjs` 文件中的 CSS 样式。

---

**文档地址**: http://YOUR_SERVER_IP:3001（如果运行了文档服务器）

**API 地址**: http://YOUR_SERVER_IP:3000

**所有 111 个接口都已完整记录！** ✅
