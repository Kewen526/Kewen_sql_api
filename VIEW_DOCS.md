# 🚀 查看 API 文档 - 快速指南

## ✅ 你现在有什么

已经生成了一个**完整的 API 文档**，类似 DBAPI 的展示风格，包含所有 **111 个接口**！

文件：`API_DOCS.html` (359 KB)

---

## 🌐 方法一：在服务器上查看（推荐）

### 在你的阿里云服务器上运行以下命令：

```bash
# 1. 进入项目目录
cd /opt/kewen-sql-api

# 2. 安装依赖（如果还没安装）
npm install

# 3. 启动文档服务器
npm run docs:serve
```

### 然后访问：

```
http://YOUR_SERVER_IP:3001
```

**记得在阿里云控制台开放 3001 端口！**

---

## 💻 方法二：在本地查看

### 1. 下载文档文件

```bash
# 在本地电脑运行
scp root@YOUR_SERVER_IP:/opt/kewen-sql-api/API_DOCS.html ~/Desktop/
```

### 2. 双击打开

直接用浏览器打开 `API_DOCS.html` 文件即可！

---

## 🎯 方法三：使用 Python 快速启动

如果你服务器上有 Python：

```bash
# 进入项目目录
cd /opt/kewen-sql-api

# 启动简单的 HTTP 服务器
python3 -m http.server 3001
```

然后访问: `http://YOUR_SERVER_IP:3001/API_DOCS.html`

---

## 📸 文档预览

文档包含以下内容：

### 🎨 精美的界面
- 渐变色头部
- 清晰的分组展示
- 响应式设计

### 🔍 强大的搜索
- 实时搜索接口
- 支持按名称、路径、功能搜索

### 📋 详细信息（每个接口）
- ✅ 接口名称和说明
- ✅ 完整的 API 地址
- ✅ HTTP 方法（GET/POST）
- ✅ Content-Type
- ✅ 请求参数表格
- ✅ 请求示例数据
- ✅ cURL 命令（一键复制）
- ✅ 响应示例

### 📊 分组展示
- **产品相关**: 43 个接口
- **采购相关**: 41 个接口
- **任务相关**: 27 个接口

---

## 🎯 快速测试接口

### 示例：测试产品接口

1. 在文档中找到"获取产品详情所有数据"接口
2. 点击展开
3. 复制 cURL 命令
4. 在终端运行：

```bash
curl -X POST http://YOUR_SERVER_IP:3000/get_product_info \
  -H "Content-Type: application/json" \
  -d '{"id": "455226"}'
```

5. 查看响应结果！

---

## 🔄 更新文档

如果你修改了 API 配置，重新生成文档：

```bash
cd /opt/kewen-sql-api
npm run docs:generate
```

新的文档会立即生效！

---

## 📱 分享给团队

### 方式 1：发送文档链接

```
http://YOUR_SERVER_IP:3001
```

团队成员可以直接在浏览器中查看所有 API 文档。

### 方式 2：发送 HTML 文件

将 `API_DOCS.html` 文件发送给团队成员，他们可以本地打开查看。

---

## 💡 提示

1. **文档是静态的**：不需要数据库，可以直接用浏览器打开
2. **搜索功能**：按 Ctrl+K (Mac: Cmd+K) 快速聚焦搜索框
3. **一键复制**：每个接口都有"复制地址"和"复制命令"按钮
4. **展开/收起**：点击接口标题可以展开/收起详情

---

## 🎉 完成！

你现在拥有一个**完整的、专业的 API 文档系统**！

- 📚 **111 个接口**全部记录
- 🔍 **快速搜索**定位接口
- 📋 **一键复制**测试命令
- 🎨 **精美界面**展示
- 📱 **响应式**设计

**完全替代 DBAPI 的文档展示！**

---

## 🚀 立即开始

在服务器上运行：

```bash
cd /opt/kewen-sql-api
npm install
npm run docs:serve
```

然后访问: **http://YOUR_SERVER_IP:3001** 🎉
