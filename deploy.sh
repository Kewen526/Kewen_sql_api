#!/bin/bash

###############################################
# Kewen SQL API 服务器一键部署脚本
# 使用 Docker Compose
###############################################

set -e  # 遇到错误立即退出

echo "🚀 开始部署 Kewen SQL API 服务器..."
echo ""

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装，请先安装 Docker"
    echo "安装命令："
    echo "  curl -fsSL https://get.docker.com | sh"
    exit 1
fi

# 检查 Docker Compose 是否安装
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose 未安装，请先安装"
    echo "安装命令："
    echo "  sudo curl -L \"https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-\$(uname -s)-\$(uname -m)\" -o /usr/local/bin/docker-compose"
    echo "  sudo chmod +x /usr/local/bin/docker-compose"
    exit 1
fi

echo "✅ Docker 检查通过"
echo ""

# 停止旧容器（如果存在）
echo "🛑 停止旧容器..."
docker-compose down 2>/dev/null || true
echo ""

# 构建并启动
echo "🔨 构建 Docker 镜像..."
docker-compose build --no-cache
echo ""

echo "🚀 启动服务..."
docker-compose up -d
echo ""

# 等待服务启动
echo "⏳ 等待服务启动（5秒）..."
sleep 5
echo ""

# 检查服务状态
echo "📊 服务状态："
docker-compose ps
echo ""

# 测试健康检查
echo "🏥 健康检查..."
if curl -f http://localhost:3000/health &> /dev/null; then
    echo "✅ 服务启动成功！"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🎉 部署完成！"
    echo ""
    echo "📌 API 地址:"
    echo "   http://localhost:3000"
    echo "   http://$(hostname -I | awk '{print $1}'):3000"
    echo ""
    echo "📊 健康检查:"
    echo "   curl http://localhost:3000/health"
    echo ""
    echo "📝 查看日志:"
    echo "   docker-compose logs -f"
    echo ""
    echo "🛑 停止服务:"
    echo "   docker-compose down"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
else
    echo "⚠️  服务启动但健康检查失败，查看日志："
    echo "   docker-compose logs"
fi
