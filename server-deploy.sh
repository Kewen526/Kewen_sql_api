#!/bin/bash
###############################################
# Kewen SQL API 服务器部署脚本
# 适用于阿里云 ECS（CentOS/AliyunLinux）
###############################################

set -e

echo "🚀 开始部署 Kewen SQL API 服务器..."
echo ""

# 1. 安装必要工具
echo "📦 安装必要工具..."
yum install -y wget unzip curl

# 2. 检查并安装 Docker
if ! command -v docker &> /dev/null; then
    echo "📦 安装 Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl start docker
    systemctl enable docker
    echo "✅ Docker 安装完成"
else
    echo "✅ Docker 已安装"
fi

# 3. 检查并安装 Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "📦 安装 Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo "✅ Docker Compose 安装完成"
else
    echo "✅ Docker Compose 已安装"
fi

echo ""

# 4. 下载代码
echo "📥 下载代码..."
cd /opt
rm -rf kewen-sql-api main.zip Kewen_sql_api-main 2>/dev/null || true

wget -q --show-progress https://github.com/Kewen526/Kewen_sql_api/archive/refs/heads/main.zip
unzip -q main.zip
mv Kewen_sql_api-main kewen-sql-api
cd kewen-sql-api

echo "✅ 代码下载完成"
echo ""

# 5. 创建 .env 配置文件
echo "⚙️  创建配置文件..."
cat > .env << 'EOF'
# 服务器配置
PORT=3000
HOST=0.0.0.0
NODE_ENV=production

# 数据源1 (YYKtG9Dv - 产品/订单库)
DB1_HOST=rm-j6ce98dcz1z47ee42so.mysql.rds.aliyuncs.com
DB1_PORT=3306
DB1_USER=gocrm
DB1_PASSWORD=4ijmvv7U
DB1_DATABASE=gocrm
DB1_POOL_MIN=2
DB1_POOL_MAX=10

# 数据源2 (ukG1SAgu - 采购库)
DB2_HOST=47.104.72.198
DB2_PORT=3306
DB2_USER=root
DB2_PASSWORD=Kewen888@
DB2_DATABASE=purchase_iw
DB2_POOL_MIN=2
DB2_POOL_MAX=10

# 数据源3 (q45gsAZj - 任务库)
DB3_HOST=47.104.72.198
DB3_PORT=3306
DB3_USER=root
DB3_PASSWORD=Kewen888@
DB3_DATABASE=order_tracking_iw
DB3_POOL_MIN=2
DB3_POOL_MAX=10

# 性能配置
DB_CONNECT_TIMEOUT=10000
DB_QUERY_TIMEOUT=30000
DB_IDLE_TIMEOUT=60000

# 日志级别
LOG_LEVEL=info

# API配置文件路径
API_CONFIG_PATH=./api_config (1).json
EOF

echo "✅ 配置文件创建完成"
echo ""

# 6. 停止旧容器（如果存在）
echo "🛑 停止旧容器..."
docker-compose down 2>/dev/null || true
echo ""

# 7. 构建并启动服务
echo "🔨 构建 Docker 镜像并启动服务..."
docker-compose up -d --build

echo ""
echo "⏳ 等待服务启动（10秒）..."
sleep 10

# 8. 检查服务状态
echo ""
echo "📊 服务状态："
docker-compose ps

echo ""
echo "🏥 健康检查..."
if curl -f http://localhost:3000/health &> /dev/null; then
    echo "✅ 服务启动成功！"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🎉 部署完成！"
    echo ""
    echo "📌 API 地址:"
    echo "   内网: http://localhost:3000"
    SERVER_IP=$(hostname -I | awk '{print $1}')
    echo "   外网: http://$SERVER_IP:3000"
    echo ""
    echo "📊 健康检查:"
    echo "   curl http://localhost:3000/health"
    echo ""
    echo "📝 查看日志:"
    echo "   cd /opt/kewen-sql-api"
    echo "   docker-compose logs -f"
    echo ""
    echo "🛑 停止服务:"
    echo "   cd /opt/kewen-sql-api"
    echo "   docker-compose down"
    echo ""
    echo "🔄 重启服务:"
    echo "   cd /opt/kewen-sql-api"
    echo "   docker-compose restart"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    # 显示所有 API 路径
    echo "📋 已注册 111 个 API 接口"
    echo "   查看完整列表: docker-compose logs | grep '✓'"
    echo ""
else
    echo "⚠️  服务启动但健康检查失败"
    echo ""
    echo "查看错误日志："
    echo "   docker-compose logs"
    echo ""
    echo "如果是数据库连接问题，检查："
    echo "   1. 数据库服务器是否允许当前服务器IP访问"
    echo "   2. 数据库账号密码是否正确"
    echo "   3. 防火墙端口是否开放"
fi
