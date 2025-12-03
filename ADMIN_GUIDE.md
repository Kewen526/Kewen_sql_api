# 🛠️ API 管理系统使用指南

## 📋 目录

1. [系统概述](#系统概述)
2. [快速开始](#快速开始)
3. [功能说明](#功能说明)
4. [API 接口文档](#api-接口文档)
5. [使用示例](#使用示例)
6. [常见问题](#常见问题)

---

## 系统概述

API 管理系统是 Kewen SQL API Server 的配套管理工具，允许您通过 Web 界面来创建、编辑和删除 API 接口，无需手动编辑 JSON 配置文件。

### ✨ 主要特性

- 🎨 **可视化管理界面** - 直观的 Web UI，无需编写代码
- ✏️ **完整的 CRUD 操作** - 创建、查看、编辑、删除 API
- 🔍 **实时搜索过滤** - 快速定位需要的接口
- 📊 **统计面板** - 实时显示 API 数量统计
- 🚀 **一键重启** - 修改后立即应用新配置
- 🔒 **安全可靠** - 所有操作都经过验证

---

## 快速开始

### 1️⃣ 启动主 API 服务器

```bash
# 进入项目目录
cd /opt/kewen-sql-api

# 启动 API 服务器（端口 3000）
npm start
```

### 2️⃣ 启动文档和管理服务器

```bash
# 启动文档服务器（端口 3001）
npm run docs:serve

# 或使用 PM2 后台运行
pm2 start docs-server.js --name api-docs
```

### 3️⃣ 访问管理界面

- **本地访问**: http://localhost:3001/admin
- **外网访问**: http://47.104.72.198:3001/admin

---

## 功能说明

### 📊 统计面板

管理界面顶部显示实时统计：
- 总接口数
- 各分组接口数量（gocrm、采购IW、跟单IW）

### 🔍 搜索功能

使用搜索框可以快速查找接口：
- 支持按 **API 名称** 搜索
- 支持按 **路径** 搜索
- 支持按 **说明** 搜索
- 实时过滤，即时显示结果

### ➕ 创建新 API

点击 "创建新 API" 按钮，填写以下信息：

| 字段 | 必填 | 说明 | 示例 |
|------|------|------|------|
| API 名称 | ✅ | 接口的名称 | `获取产品信息` |
| API 路径 | ✅ | URL 路径 | `/get_product_info` |
| 说明 | ❌ | 功能描述 | `根据ID获取产品详细信息` |
| 分组 | ✅ | 所属分组 | `gocrm` |
| 数据源 | ✅ | 使用的数据库 | `YYKtG9Dv` |
| HTTP 方法 | ✅ | 请求方法 | `POST` / `GET` |
| Content-Type | ✅ | 内容类型 | `json` |
| SQL 查询 | ✅ | 数据库查询语句 | `SELECT * FROM products WHERE id = #{id}` |
| 参数定义 | ❌ | 请求参数 | `id:int:产品ID` |
| 启用事务 | ❌ | 是否使用事务 | ☐ 勾选启用 |

#### SQL 语法支持

支持 MyBatis 风格的参数绑定：

```sql
-- 简单参数
SELECT * FROM products WHERE id = #{id}

-- 多个参数
SELECT * FROM orders
WHERE customer_id = #{customerId}
  AND status = #{status}

-- 数组参数（foreach）
SELECT * FROM products
WHERE id IN
<foreach collection="ids" item="id" open="(" separator="," close=")">
  #{id}
</foreach>
```

#### 参数定义格式

每行一个参数，格式：`参数名:类型:说明`

```
id:int:产品ID
name:string:产品名称
status:string:状态
ids:array:ID数组
```

支持的类型：
- `int` - 整数
- `string` - 字符串
- `float` - 浮点数
- `boolean` - 布尔值
- `array` - 数组
- `object` - 对象

### ✏️ 编辑 API

点击任意 API 行的 "编辑" 按钮，可以修改该接口的所有配置。

### 🗑️ 删除 API

点击 "删除" 按钮，确认后即可删除接口。

⚠️ **注意**：删除操作不可恢复，请谨慎操作！

### 🚀 应用更改

完成 API 的创建、编辑或删除后，需要重启服务器以应用更改：

1. 点击 "重启服务器" 按钮
2. 确认重启
3. 等待 5-10 秒
4. 刷新页面验证更改

服务器会自动重新加载配置，无需手动操作。

---

## API 接口文档

管理系统提供以下 RESTful API 接口：

### 1. 获取所有 API 列表

```http
GET /admin/apis
```

**响应示例**：
```json
{
  "success": true,
  "count": 111,
  "apis": [
    {
      "id": "NRbvz7ca",
      "name": "获取产品信息",
      "path": "/get_product_info",
      "method": "POST",
      "groupId": "yTMWJ8W3",
      "datasourceId": "YYKtG9Dv",
      "sql": "SELECT * FROM products WHERE id = #{id}",
      "apiParams": [
        {
          "name": "id",
          "type": "int",
          "note": "产品ID"
        }
      ]
    }
  ]
}
```

### 2. 获取单个 API 详情

```http
GET /admin/apis/:id
```

**参数**：
- `id` - API 的唯一标识

### 3. 创建新 API

```http
POST /admin/apis
Content-Type: application/json

{
  "name": "获取产品信息",
  "path": "/get_product_info",
  "note": "根据ID获取产品详情",
  "groupId": "yTMWJ8W3",
  "datasourceId": "YYKtG9Dv",
  "method": "POST",
  "contentType": "json",
  "sql": "SELECT * FROM products WHERE id = #{id}",
  "apiParams": [
    {
      "name": "id",
      "type": "int",
      "note": "产品ID"
    }
  ],
  "isTransaction": false
}
```

**响应示例**：
```json
{
  "success": true,
  "message": "API 创建成功",
  "api": {
    "id": "NRbvz7ca",
    "name": "获取产品信息",
    "path": "/get_product_info"
  }
}
```

### 4. 更新 API

```http
PUT /admin/apis/:id
Content-Type: application/json

{
  "name": "获取产品详细信息",
  "note": "更新后的说明"
}
```

### 5. 删除 API

```http
DELETE /admin/apis/:id
```

### 6. 获取分组列表

```http
GET /admin/groups
```

**响应示例**：
```json
{
  "success": true,
  "groups": [
    {
      "id": "yTMWJ8W3",
      "name": "gocrm"
    },
    {
      "id": "H1BFe93S",
      "name": "采购IW"
    },
    {
      "id": "j2pRZs0O",
      "name": "跟单IW"
    }
  ]
}
```

### 7. 获取数据源列表

```http
GET /admin/datasources
```

**响应示例**：
```json
{
  "success": true,
  "datasources": [
    {
      "id": "YYKtG9Dv",
      "name": "gocrm (阿里云RDS)"
    },
    {
      "id": "ukG1SAgu",
      "name": "采购IW"
    },
    {
      "id": "q45gsAZj",
      "name": "跟单IW"
    }
  ]
}
```

### 8. 重启服务器

```http
POST /admin/restart
```

**响应示例**：
```json
{
  "success": true,
  "message": "服务器将在 3 秒后重启"
}
```

---

## 使用示例

### 示例 1：创建一个简单查询接口

**需求**：创建一个接口，根据订单ID查询订单信息

**步骤**：

1. 点击 "创建新 API"
2. 填写信息：
   - 名称：`获取订单信息`
   - 路径：`/get_order_info`
   - 分组：`采购IW`
   - 数据源：`ukG1SAgu`
   - SQL：`SELECT * FROM orders WHERE id = #{id}`
   - 参数：`id:int:订单ID`
3. 点击 "保存"
4. 点击 "重启服务器"
5. 测试接口：

```bash
curl -X POST http://47.104.72.198:3000/get_order_info \
  -H "Content-Type: application/json" \
  -d '{"id": 12345}'
```

### 示例 2：创建带多个参数的接口

**需求**：查询指定时间范围内的订单

**SQL**：
```sql
SELECT * FROM orders
WHERE created_at >= #{startDate}
  AND created_at <= #{endDate}
  AND status = #{status}
```

**参数定义**：
```
startDate:string:开始日期
endDate:string:结束日期
status:string:订单状态
```

### 示例 3：创建带事务的更新接口

**需求**：更新产品价格（需要事务保护）

**配置**：
- SQL：`UPDATE products SET price = #{price} WHERE id = #{id}`
- 启用事务：☑️ 勾选
- 参数：
  ```
  id:int:产品ID
  price:float:新价格
  ```

### 示例 4：使用 cURL 测试管理接口

```bash
# 获取所有 API
curl http://47.104.72.198:3000/admin/apis

# 创建新 API
curl -X POST http://47.104.72.198:3000/admin/apis \
  -H "Content-Type: application/json" \
  -d '{
    "name": "测试接口",
    "path": "/test",
    "groupId": "yTMWJ8W3",
    "datasourceId": "YYKtG9Dv",
    "sql": "SELECT 1",
    "method": "POST",
    "contentType": "json"
  }'

# 删除 API
curl -X DELETE http://47.104.72.198:3000/admin/apis/NRbvz7ca

# 重启服务器
curl -X POST http://47.104.72.198:3000/admin/restart
```

---

## 常见问题

### Q1: 修改 API 后不生效？

**A**: 需要点击 "重启服务器" 按钮，让服务器重新加载配置文件。

### Q2: 重启服务器后页面无法访问？

**A**: 服务器重启需要 5-10 秒，请稍等片刻后刷新页面。如果使用 PM2 管理，服务器会自动重启。

### Q3: 删除 API 后能恢复吗？

**A**: 不能！删除操作会直接修改 `api_config (1).json` 文件，无法恢复。建议删除前先备份配置文件。

### Q4: 如何备份 API 配置？

**A**: 定期备份 `api_config (1).json` 文件：

```bash
# 手动备份
cp "api_config (1).json" "api_config.backup.$(date +%Y%m%d).json"

# 或使用 Git
git add "api_config (1).json"
git commit -m "backup: API 配置备份"
```

### Q5: SQL 参数绑定语法是什么？

**A**: 使用 MyBatis 风格：`#{参数名}`

```sql
-- 正确 ✅
SELECT * FROM users WHERE id = #{userId}

-- 错误 ❌
SELECT * FROM users WHERE id = $userId
SELECT * FROM users WHERE id = :userId
```

### Q6: 如何处理数组参数？

**A**: 使用 `<foreach>` 标签：

```sql
SELECT * FROM products
WHERE id IN
<foreach collection="ids" item="id" open="(" separator="," close=")">
  #{id}
</foreach>
```

请求示例：
```json
{
  "ids": [1, 2, 3, 4, 5]
}
```

### Q7: 管理界面的安全性？

**A**: 当前版本没有身份认证。**强烈建议**：
- 使用防火墙限制 3000 和 3001 端口的访问
- 只允许内网或特定 IP 访问管理接口
- 生产环境添加身份认证中间件

```bash
# 阿里云安全组设置示例
# 只允许公司 IP 访问管理端口
允许 YOUR_COMPANY_IP:3001
拒绝 0.0.0.0/0:3001
```

### Q8: 如何查看服务器日志？

**A**: 使用 PM2 查看：

```bash
# 查看主服务器日志
pm2 logs kewen-sql-api

# 查看文档服务器日志
pm2 logs api-docs

# 实时查看错误日志
pm2 logs kewen-sql-api --err
```

### Q9: 创建 API 时提示 "分组不存在"？

**A**: 分组信息来自 `api_config (1).json` 的 `groupList`。如需添加新分组，需手动编辑配置文件：

```json
{
  "groupList": [
    {
      "id": "yTMWJ8W3",
      "name": "gocrm"
    },
    {
      "id": "NEW_GROUP_ID",
      "name": "新分组名称"
    }
  ]
}
```

### Q10: 如何批量导入 API？

**A**: 当前版本不支持批量导入，但可以通过脚本调用管理 API 实现：

```bash
# 批量创建示例
for api in $(cat apis.json | jq -c '.[]'); do
  curl -X POST http://47.104.72.198:3000/admin/apis \
    -H "Content-Type: application/json" \
    -d "$api"
done
```

---

## 📞 技术支持

如有问题，请联系开发团队或提交 Issue。

---

## 🔄 版本历史

### v1.0.0 (2025-12-03)
- ✅ 初始版本发布
- ✅ 完整的 CRUD 功能
- ✅ Web 管理界面
- ✅ 自动重启支持

---

**管理界面地址**: http://47.104.72.198:3001/admin

**API 服务器地址**: http://47.104.72.198:3000

**当前 API 数量**: 111 个接口
