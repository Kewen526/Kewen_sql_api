#!/bin/bash

# ========================================
# Kewen SQL API - 快速更新脚本 (Podman版)
# 适用于：代码更新后快速重启服务
# 不重建镜像，只拉取代码并重启容器
# ========================================

set -e

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  快速更新并重启服务${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

cd /opt/kewen-sql-api

# 步骤1: 拉取最新代码（使用镜像加速）
echo -e "${YELLOW}📥 拉取最新代码...${NC}"
git config --global url."https://ghproxy.com/https://github.com/".insteadOf "https://github.com/"

# 带重试的 git pull
MAX_RETRIES=4
RETRY_DELAY=2

for i in $(seq 1 $MAX_RETRIES); do
    if git pull origin main; then
        echo -e "${GREEN}✅ 代码拉取成功${NC}"
        break
    else
        if [ $i -lt $MAX_RETRIES ]; then
            echo -e "${YELLOW}⚠️  拉取失败，${RETRY_DELAY}秒后重试...${NC}"
            sleep $RETRY_DELAY
            RETRY_DELAY=$((RETRY_DELAY * 2))
        else
            echo -e "${RED}❌ 代码拉取失败${NC}"
            exit 1
        fi
    fi
done

git config --global --unset url."https://ghproxy.com/https://github.com/".insteadOf

echo ""

# 步骤2: 重启容器
echo -e "${YELLOW}🔄 重启容器...${NC}"
podman restart kewen-sql-api

echo ""

# 步骤3: 查看日志
echo -e "${YELLOW}📝 查看最新日志 (最后50行):${NC}"
sleep 2
podman logs kewen-sql-api --tail 50

echo ""
echo -e "${GREEN}✅ 更新完成！${NC}"
