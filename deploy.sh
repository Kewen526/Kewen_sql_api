#!/bin/bash

###############################################
# Kewen SQL API 服务器一键部署脚本
# 使用 Docker Compose
# 支持配置文件备份和恢复，保护用户数据
###############################################

set -e  # 遇到错误立即退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 开始部署 Kewen SQL API 服务器...${NC}"
echo ""

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker 未安装，请先安装 Docker${NC}"
    echo "安装命令："
    echo "  curl -fsSL https://get.docker.com | sh"
    exit 1
fi

# 检查 Docker Compose 是否安装
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose 未安装，请先安装${NC}"
    echo "安装命令："
    echo "  sudo curl -L \"https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-\$(uname -s)-\$(uname -m)\" -o /usr/local/bin/docker-compose"
    echo "  sudo chmod +x /usr/local/bin/docker-compose"
    exit 1
fi

echo -e "${GREEN}✅ Docker 检查通过${NC}"
echo ""

# ========== 步骤1: 备份配置文件 ==========
echo -e "${YELLOW}💾 步骤1: 备份配置文件...${NC}"

# 创建临时备份目录
BACKUP_DIR="/tmp/kewen-sql-api-backup-$(date +%s)"
mkdir -p "$BACKUP_DIR"

# 备份用户数据文件（如果存在）
CONFIG_FILES=("api_config (1).json" "datasources.json" "groups.json")
BACKUP_COUNT=0
for file in "${CONFIG_FILES[@]}"; do
    if [ -f "$file" ]; then
        cp "$file" "$BACKUP_DIR/"
        echo "✅ 已备份: $file"
        BACKUP_COUNT=$((BACKUP_COUNT + 1))
    fi
done

if [ $BACKUP_COUNT -eq 0 ]; then
    echo "ℹ️  没有需要备份的配置文件"
fi

echo ""

# ========== 步骤2: 拉取代码（如果是git仓库）==========
if [ -d ".git" ]; then
    echo -e "${YELLOW}📥 步骤2: 拉取最新代码...${NC}"

    # 拉取代码，带重试机制
    MAX_RETRIES=4
    RETRY_DELAY=2

    for i in $(seq 1 $MAX_RETRIES); do
        echo "尝试拉取代码 (第 $i 次)..."
        if git pull origin main 2>/dev/null || git pull 2>/dev/null; then
            echo -e "${GREEN}✅ 代码拉取成功${NC}"
            break
        else
            if [ $i -lt $MAX_RETRIES ]; then
                echo -e "${YELLOW}⚠️  拉取失败，${RETRY_DELAY}秒后重试...${NC}"
                sleep $RETRY_DELAY
                RETRY_DELAY=$((RETRY_DELAY * 2))  # 指数退避
            else
                echo -e "${YELLOW}⚠️  代码拉取失败，继续使用本地代码${NC}"
            fi
        fi
    done
    echo ""
fi

# ========== 步骤2.5: 恢复配置文件 ==========
if [ $BACKUP_COUNT -gt 0 ]; then
    echo -e "${YELLOW}🔄 恢复配置文件...${NC}"

    # 恢复备份的配置文件
    for file in "${CONFIG_FILES[@]}"; do
        if [ -f "$BACKUP_DIR/$file" ]; then
            cp "$BACKUP_DIR/$file" "$file"
            echo "✅ 已恢复: $file"
        fi
    done

    echo -e "${GREEN}✅ 配置文件已恢复${NC}"
    echo ""
fi

# 清理备份目录
rm -rf "$BACKUP_DIR"

# ========== 步骤3: 检查配置文件 ==========
echo -e "${YELLOW}📋 步骤3: 检查配置文件...${NC}"

# 检查 .env 文件
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env 文件不存在，从模板复制...${NC}"
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${GREEN}✅ 已创建 .env 文件${NC}"
        echo -e "${RED}⚠️  请编辑 .env 文件填写正确的数据库配置！${NC}"
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
    "id": "SYSTEM_USER_MGMT",
    "name": "系统用户管理",
    "description": "系统用户相关API接口",
    "order": 1
  },
  {
    "id": "AUTH_MGMT",
    "name": "认证管理",
    "description": "用户认证相关API接口",
    "order": 2
  },
  {
    "id": "yTMWJ8W3",
    "name": "示例分组",
    "description": "这是一个示例分组",
    "order": 3
  },
  {
    "id": "group_data",
    "name": "数据写入",
    "description": "数据写入相关API",
    "order": 4
  }
]
EOF
    echo -e "${GREEN}✅ 已创建默认 groups.json${NC}"
else
    echo -e "${GREEN}✅ groups.json 存在${NC}"
fi

# 确保 logs 目录存在
mkdir -p logs
echo -e "${GREEN}✅ logs 目录已就绪${NC}"

echo ""

# ========== 步骤4: 停止旧容器 ==========
echo -e "${YELLOW}🛑 步骤4: 停止旧容器...${NC}"
docker-compose down 2>/dev/null || true
echo ""

# ========== 步骤5: 构建并启动 ==========
echo -e "${YELLOW}🔨 步骤5: 构建 Docker 镜像...${NC}"
docker-compose build --no-cache
echo ""

echo -e "${YELLOW}🚀 步骤6: 启动服务...${NC}"
docker-compose up -d
echo ""

# ========== 步骤7: 等待服务启动 ==========
echo -e "${YELLOW}⏳ 步骤7: 等待服务启动（5秒）...${NC}"
sleep 5
echo ""

# ========== 步骤8: 检查服务状态 ==========
echo -e "${YELLOW}📊 步骤8: 检查服务状态${NC}"
docker-compose ps
echo ""

# 测试健康检查
echo -e "${YELLOW}🏥 健康检查...${NC}"
if curl -f http://localhost:3000/health &> /dev/null; then
    echo -e "${GREEN}✅ 服务启动成功！${NC}"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${GREEN}🎉 部署完成！${NC}"
    echo ""
    echo "📌 API 地址:"
    echo "   http://localhost:3000"
    if command -v hostname &> /dev/null; then
        echo "   http://$(hostname -I 2>/dev/null | awk '{print $1}'):3000"
    fi
    echo ""
    echo "📌 管理界面:"
    echo "   http://localhost:3000/admin.html"
    echo ""
    echo "📊 健康检查:"
    echo "   curl http://localhost:3000/health"
    echo ""
    echo "📝 查看日志:"
    echo "   docker-compose logs -f"
    echo ""
    echo "🛑 停止服务:"
    echo "   docker-compose down"
    echo ""
    echo "⚠️  配置文件已备份恢复，您的API数据不会丢失！"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
else
    echo -e "${YELLOW}⚠️  服务启动但健康检查失败，查看日志：${NC}"
    echo "   docker-compose logs"
fi
