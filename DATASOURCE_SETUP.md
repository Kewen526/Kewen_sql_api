# 数据源自定义配置功能使用指南

## 📋 功能说明

已成功添加以下功能：
1. ✅ 在管理界面自定义添加数据源
2. ✅ SQL编辑器、参数定义、测试参数输入框使用黑色代码主题
3. ✅ 数据源的可视化管理（增删改查）

---

## 🚀 启动/重启服务器

**重要：修改代码后需要重启服务器！**

### 方法1：使用 PM2（推荐）
```bash
# 重启服务
pm2 restart kewen-sql-api

# 查看日志
pm2 logs kewen-sql-api

# 查看状态
pm2 status
```

### 方法2：直接运行
```bash
# 停止旧进程（如果有）
pkill -f "node.*server.js"

# 启动服务
cd /home/user/Kewen_sql_api
npm start
```

---

## 🗄️ 使用数据源管理功能

### 1. 访问管理界面
```
http://47.104.72.198:3001/admin
```

### 2. 添加新数据源

**步骤：**
1. 点击顶部工具栏的 **"🗄️ 管理数据源"** 按钮
2. 在弹出的数据源列表中，点击 **"➕ 添加新数据源"**
3. 填写数据源信息：
   - **数据源名称**：例如 "测试数据库"
   - **主机地址**：例如 "localhost" 或 "192.168.1.100"
   - **端口号**：默认 3306
   - **用户名**：数据库用户名
   - **密码**：数据库密码
   - **数据库名称**：要连接的数据库名
   - **最小/最大连接数**：连接池配置（可选）

4. （可选）点击 **"🧪 测试连接"** 验证配置是否正确
5. 点击 **"💾 保存"**

**特点：**
- ✅ 保存后立即生效，无需重启服务器
- ✅ 新数据源会自动添加到连接池
- ✅ 创建API时可立即选择该数据源

### 3. 编辑数据源

1. 在数据源列表中点击 **"编辑"** 按钮
2. 修改配置（密码留空表示不修改密码）
3. 保存后自动重新加载连接池

### 4. 删除数据源

1. 点击 **"删除"** 按钮
2. 确认删除（⚠️ 警告：使用该数据源的API将无法工作）

---

## 🎨 黑色代码编辑器

以下输入框已应用黑色主题：

### 1. SQL编写窗口
- VS Code 风格暗色主题
- 支持多行SQL编辑
- 美化的滚动条

### 2. 参数定义输入框
- 黑色背景 (#1e1e1e)
- 等宽字体显示

### 3. 测试参数配置输入框
- JSON 代码编辑器样式
- 选中文本高亮显示

---

## 📂 配置文件说明

### datasources.json
位置：`/home/user/Kewen_sql_api/datasources.json`

存储所有数据源配置，支持环境变量占位符：

```json
{
  "datasources": [
    {
      "id": "YYKtG9Dv",
      "name": "gocrm (阿里云RDS)",
      "host": "${DB1_HOST}",
      "port": "${DB1_PORT}",
      "user": "${DB1_USER}",
      "password": "${DB1_PASSWORD}",
      "database": "${DB1_DATABASE}",
      "poolMin": 2,
      "poolMax": 10,
      "envPrefix": "DB1",
      "createTime": "2025-10-01 10:00:00",
      "updateTime": "2025-10-01 10:00:00"
    }
  ]
}
```

**说明：**
- `${DB1_HOST}` 等占位符会从 `.env` 文件读取
- 新增的数据源不使用占位符，直接存储实际值
- `envPrefix` 字段表示该数据源使用哪个环境变量前缀（可为null）

---

## 🔧 新增的API端点

```
GET    /admin/datasources           获取数据源列表
GET    /admin/datasources/:id       获取单个数据源详情
POST   /admin/datasources           创建新数据源
PUT    /admin/datasources/:id       更新数据源
DELETE /admin/datasources/:id       删除数据源
POST   /admin/datasources/test      测试数据源连接
```

### 使用示例

#### 创建数据源
```bash
curl -X POST http://47.104.72.198:3000/admin/datasources \
  -H "Content-Type: application/json" \
  -d '{
    "name": "测试数据库",
    "host": "localhost",
    "port": 3306,
    "user": "root",
    "password": "password",
    "database": "test_db",
    "poolMin": 2,
    "poolMax": 10
  }'
```

#### 测试连接
```bash
curl -X POST http://47.104.72.198:3000/admin/datasources/test \
  -H "Content-Type: application/json" \
  -d '{
    "host": "localhost",
    "port": 3306,
    "user": "root",
    "password": "password",
    "database": "test_db"
  }'
```

---

## 🐛 故障排查

### 问题1：管理界面打不开或显示错误

**解决方案：**
```bash
# 检查服务是否运行
pm2 status

# 查看服务日志
pm2 logs kewen-sql-api

# 重启服务
pm2 restart kewen-sql-api
```

### 问题2：数据源列表为空

**解决方案：**
1. 检查 `datasources.json` 文件是否存在
2. 检查文件权限：
   ```bash
   chmod 600 /home/user/Kewen_sql_api/datasources.json
   ```
3. 检查JSON格式是否正确

### 问题3：黑色代码框没有显示

**解决方案：**
1. 清除浏览器缓存（Ctrl+F5 强制刷新）
2. 检查 `admin.html` 是否是最新版本：
   ```bash
   grep -c "code-editor" admin.html
   # 应该返回大于0的数字
   ```

### 问题4：添加数据源后无法连接

**解决方案：**
1. 点击"测试连接"验证配置
2. 检查数据库服务器是否允许远程连接
3. 检查防火墙设置
4. 查看服务器日志：
   ```bash
   pm2 logs kewen-sql-api --lines 50
   ```

---

## 📊 验证安装

运行以下命令验证所有组件是否正确安装：

```bash
# 1. 检查文件是否存在
ls -la datasources.json src/utils/datasourceManager.js

# 2. 检查 admin.html 是否包含新功能
grep -c "管理数据源" admin.html  # 应该 > 0
grep -c "code-editor" admin.html  # 应该 > 0

# 3. 验证API端点
curl http://47.104.72.198:3000/admin/datasources

# 4. 查看服务器日志确认路由注册
pm2 logs kewen-sql-api --lines 20 | grep datasource
```

---

## 📝 Git 信息

```
Commit: f8795af
Branch: main (已合并)
PR: #12
功能: 添加自定义数据源配置功能和黑色代码编辑器样式
```

---

## 🎯 下一步

1. **重启服务器**（重要！）
   ```bash
   pm2 restart kewen-sql-api
   ```

2. **访问管理界面**
   ```
   http://47.104.72.198:3001/admin
   ```

3. **测试新功能**
   - 点击"管理数据源"按钮
   - 添加一个测试数据源
   - 创建API时选择新数据源

4. **检查黑色代码框**
   - 创建新API
   - 查看SQL编辑器、参数定义、测试参数输入框的样式

---

## ❓ 常见问题

**Q: 为什么需要重启服务器？**
A: 虽然数据源可以动态添加到连接池，但路由注册需要在服务启动时进行，所以首次部署后需要重启。

**Q: 环境变量和直接配置有什么区别？**
A: 环境变量方式更安全（密码不会明文存储在JSON中），适合生产环境。直接配置方式更方便快捷，适合开发测试。

**Q: 可以同时使用环境变量和直接配置吗？**
A: 可以！现有的3个数据源使用环境变量，新添加的数据源直接存储配置。

---

如有问题，请查看：
- 服务器日志：`pm2 logs kewen-sql-api`
- GitHub Issues: https://github.com/Kewen526/Kewen_sql_api/issues
