#!/bin/bash

# ========================================
# Kewen SQL API - 一键部署脚本 (Podman版)
# 服务器路径：/opt/kewen-sql-api
# ========================================

set -e  # 遇到错误立即退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Kewen SQL API - 一键部署脚本${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# 检查是否在正确的目录
DEPLOY_DIR="/opt/kewen-sql-api"
if [ ! -d "$DEPLOY_DIR" ]; then
    echo -e "${RED}❌ 错误：目录 $DEPLOY_DIR 不存在${NC}"
    echo "请先创建目录: sudo mkdir -p $DEPLOY_DIR"
    exit 1
fi

cd "$DEPLOY_DIR"
echo -e "${GREEN}📁 当前目录: $(pwd)${NC}"
echo ""

# ========== 步骤1: 备份配置文件 ==========
echo -e "${YELLOW}💾 步骤1: 备份配置文件...${NC}"

# 创建临时备份目录
BACKUP_DIR="/tmp/kewen-sql-api-backup-$(date +%s)"
mkdir -p "$BACKUP_DIR"

# 备份用户数据文件（如果存在）
CONFIG_FILES=("api_config (1).json" "datasources.json" "groups.json")
for file in "${CONFIG_FILES[@]}"; do
    if [ -f "$file" ]; then
        cp "$file" "$BACKUP_DIR/"
        echo "✅ 已备份: $file"
    fi
done

echo ""

# ========== 步骤2: 拉取最新代码 ==========
echo -e "${YELLOW}📥 步骤2: 拉取最新代码...${NC}"

# 配置 GitHub 代理加速
git config --global url."https://ghproxy.com/https://github.com/".insteadOf "https://github.com/"

# 拉取代码，带重试机制
MAX_RETRIES=4
RETRY_DELAY=2

for i in $(seq 1 $MAX_RETRIES); do
    echo "尝试拉取代码 (第 $i 次)..."
    if git pull origin main; then
        echo -e "${GREEN}✅ 代码拉取成功${NC}"
        break
    else
        if [ $i -lt $MAX_RETRIES ]; then
            echo -e "${YELLOW}⚠️  拉取失败，${RETRY_DELAY}秒后重试...${NC}"
            sleep $RETRY_DELAY
            RETRY_DELAY=$((RETRY_DELAY * 2))  # 指数退避
        else
            echo -e "${RED}❌ 代码拉取失败，已重试 $MAX_RETRIES 次${NC}"
            exit 1
        fi
    fi
done

# 恢复正常 git 配置
git config --global --unset url."https://ghproxy.com/https://github.com/".insteadOf

echo ""

# ========== 步骤2.5: 恢复配置文件 ==========
echo -e "${YELLOW}🔄 恢复配置文件...${NC}"

# 恢复备份的配置文件
for file in "${CONFIG_FILES[@]}"; do
    if [ -f "$BACKUP_DIR/$file" ]; then
        cp "$BACKUP_DIR/$file" "$file"
        echo "✅ 已恢复: $file"
    fi
done

# 清理备份目录
rm -rf "$BACKUP_DIR"
echo -e "${GREEN}✅ 配置文件已恢复，备份已清理${NC}"

echo ""

# ========== 步骤3: 检查并确保配置文件存在 ==========
echo -e "${YELLOW}📋 步骤3: 检查配置文件...${NC}"

# 检查 .env 文件
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env 文件不存在，从模板复制...${NC}"
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${GREEN}✅ 已创建 .env 文件，请编辑配置数据库密码${NC}"
        echo -e "${RED}⚠️  请立即编辑 .env 文件填写正确的数据库配置！${NC}"
        # 可选：在这里暂停，让用户编辑
        # read -p "按回车继续..."
    else
        echo -e "${RED}❌ .env.example 模板文件不存在${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ .env 文件存在${NC}"
fi

# 检查 groups.json
if [ ! -f "groups.json" ]; then
    echo -e "${YELLOW}⚠️  groups.json 不存在，创建默认分组...${NC}"
    cat > groups.json << 'EOF'
[
  {
    "id": "yTMWJ8W3",
    "name": "gocrm",
    "description": "gocrm 相关API接口",
    "order": 1
  },
  {
    "id": "H1BFe93S",
    "name": "采购IW",
    "description": "采购IW 相关API接口",
    "order": 2
  },
  {
    "id": "j2pRZs0O",
    "name": "跟单IW",
    "description": "跟单IW 相关API接口",
    "order": 3
  }
]
EOF
    echo -e "${GREEN}✅ 已创建默认 groups.json${NC}"
else
    echo -e "${GREEN}✅ groups.json 存在${NC}"
fi

# 检查其他配置文件
if [ ! -f "api_config (1).json" ]; then
    echo -e "${RED}❌ api_config (1).json 不存在，请确认配置文件${NC}"
fi

if [ ! -f "datasources.json" ]; then
    echo -e "${RED}❌ datasources.json 不存在，请确认配置文件${NC}"
fi

# 确保 logs 目录存在
mkdir -p logs
echo -e "${GREEN}✅ logs 目录已就绪${NC}"

echo ""

# ========== 步骤4: 构建镜像 ==========
echo -e "${YELLOW}🔨 步骤4: 构建 Docker 镜像...${NC}"

if command -v podman &> /dev/null; then
    # 使用 podman build
    podman build -t kewen-sql-api:latest .
    echo -e "${GREEN}✅ 镜像构建成功${NC}"
else
    echo -e "${RED}❌ 未找到 podman 命令${NC}"
    exit 1
fi

echo ""

# ========== 步骤5: 停止并删除旧容器 ==========
echo -e "${YELLOW}🛑 步骤5: 停止旧容器...${NC}"

if podman ps -a | grep -q kewen-sql-api; then
    echo "停止容器 kewen-sql-api..."
    podman stop kewen-sql-api || true
    echo "删除容器 kewen-sql-api..."
    podman rm kewen-sql-api || true
    echo -e "${GREEN}✅ 旧容器已清理${NC}"
else
    echo "未找到旧容器，跳过"
fi

echo ""

# ========== 步骤6: 启动新容器 ==========
echo -e "${YELLOW}🚀 步骤6: 启动新容器...${NC}"

# 从 .env 读取端口（如果没有则使用默认3000）
PORT=${PORT:-3000}

# 启动容器，挂载配置文件
podman run -d \
  --name kewen-sql-api \
  --restart unless-stopped \
  -p ${PORT}:3000 \
  --env-file .env \
  -v "$(pwd)/logs:/app/logs:z" \
  -v "$(pwd)/api_config (1).json:/app/api_config (1).json:z" \
  -v "$(pwd)/datasources.json:/app/datasources.json:z" \
  -v "$(pwd)/groups.json:/app/groups.json:z" \
  kewen-sql-api:latest

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 容器启动成功${NC}"
else
    echo -e "${RED}❌ 容器启动失败${NC}"
    exit 1
fi

echo ""

# ========== 步骤7: 等待服务就绪 ==========
echo -e "${YELLOW}⏳ 步骤7: 等待服务启动...${NC}"
sleep 5

# ========== 步骤8: 验证服务 ==========
echo -e "${YELLOW}🔍 步骤8: 验证服务状态...${NC}"
echo ""

# 查看容器状态
echo "📊 容器状态："
podman ps | grep kewen-sql-api
echo ""

# 查看最新日志
echo "📝 最新日志 (最后50行)："
podman logs kewen-sql-api --tail 50
echo ""

# 检查端口
echo "🔌 端口监听："
netstat -tulpn | grep ${PORT} || ss -tulpn | grep ${PORT} || echo "⚠️  无法查看端口状态"
echo ""

# 测试健康检查
echo "🏥 健康检查："
if curl -s http://localhost:${PORT}/health > /dev/null; then
    echo -e "${GREEN}✅ 服务健康检查通过${NC}"
else
    echo -e "${YELLOW}⚠️  健康检查失败，请查看日志${NC}"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ 部署完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "📌 访问地址："
echo "   管理界面: http://服务器IP:${PORT}/admin.html"
echo "   API文档:  http://服务器IP:${PORT}/api-docs"
echo ""
echo "📌 常用命令："
echo "   查看日志:   podman logs kewen-sql-api -f"
echo "   重启服务:   podman restart kewen-sql-api"
echo "   停止服务:   podman stop kewen-sql-api"
echo "   查看状态:   podman ps | grep kewen-sql-api"
echo ""
