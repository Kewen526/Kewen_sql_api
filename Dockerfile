# 多阶段构建 - 优化镜像大小
FROM node:20-alpine AS base

# 安装生产依赖
FROM base AS deps
WORKDIR /app

COPY package.json ./
RUN npm install --production --ignore-scripts

# 生产镜像
FROM base AS runner
WORKDIR /app

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 apiserver

# 创建日志目录
RUN mkdir -p /app/logs && chown -R apiserver:nodejs /app/logs

# 复制依赖
COPY --from=deps --chown=apiserver:nodejs /app/node_modules ./node_modules

# 复制应用代码
COPY --chown=apiserver:nodejs . .

# 切换到非 root 用户
USER apiserver

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# 启动命令
CMD ["node", "src/server.js"]
