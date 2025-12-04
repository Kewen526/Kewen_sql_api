#!/bin/bash

echo "================================"
echo "验证数据源配置功能安装情况"
echo "================================"
echo ""

# 1. 检查关键文件
echo "1. 检查关键文件..."
files=(
  "datasources.json"
  "src/utils/datasourceManager.js"
  "admin.html"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✅ $file 存在"
  else
    echo "  ❌ $file 不存在"
  fi
done
echo ""

# 2. 检查 admin.html 新功能
echo "2. 检查 admin.html 新功能..."
if grep -q "管理数据源" admin.html; then
  echo "  ✅ 数据源管理按钮已添加"
else
  echo "  ❌ 数据源管理按钮未找到"
fi

if grep -q "code-editor" admin.html; then
  echo "  ✅ 黑色代码框样式已添加"
else
  echo "  ❌ 黑色代码框样式未找到"
fi

if grep -q "openDatasourceManagementModal" admin.html; then
  echo "  ✅ 数据源管理函数已添加"
else
  echo "  ❌ 数据源管理函数未找到"
fi
echo ""

# 3. 检查后端文件
echo "3. 检查后端文件..."
if grep -q "datasourceManager" src/routes/adminRoutes.js; then
  echo "  ✅ adminRoutes.js 已导入 datasourceManager"
else
  echo "  ❌ adminRoutes.js 未导入 datasourceManager"
fi

if grep -q "/admin/datasources" src/routes/adminRoutes.js; then
  echo "  ✅ 数据源API端点已添加"
else
  echo "  ❌ 数据源API端点未添加"
fi

if grep -q "addDatasourcePool" src/database/pool.js; then
  echo "  ✅ 动态添加数据源功能已添加"
else
  echo "  ❌ 动态添加数据源功能未添加"
fi
echo ""

# 4. 统计代码行数
echo "4. 统计新增代码..."
echo "  - datasources.json: $(wc -l < datasources.json) 行"
echo "  - datasourceManager.js: $(wc -l < src/utils/datasourceManager.js) 行"
echo "  - admin.html: $(wc -l < admin.html) 行"
echo ""

# 5. 检查Node进程
echo "5. 检查服务器状态..."
if pgrep -f "node.*server.js" > /dev/null; then
  echo "  ⚠️  服务器正在运行（需要重启才能加载新功能）"
  echo "     运行: pkill -f 'node.*server.js' && npm start"
else
  echo "  ❌ 服务器未运行"
  echo "     运行: npm start"
fi
echo ""

# 6. 建议
echo "================================"
echo "下一步操作："
echo "================================"
echo "1. 启动/重启服务器："
echo "   npm start"
echo ""
echo "2. 或者使用PM2（如果已安装）："
echo "   pm2 restart kewen-sql-api"
echo ""
echo "3. 访问管理界面："
echo "   http://47.104.72.198:3001/admin"
echo ""
echo "4. 点击 '🗄️ 管理数据源' 按钮测试新功能"
echo ""
echo "详细使用说明请查看: DATASOURCE_SETUP.md"
echo "================================"
