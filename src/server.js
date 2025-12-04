/**
 * Kewen SQL API Server
 * 高性能、低内存的 SQL API 服务器
 * 替代 DBAPI
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import compress from '@fastify/compress';
import dotenv from 'dotenv';
import poolManager from './database/pool.js';
import { registerAutoRoutes } from './routes/autoRoutes.js';
import { registerSystemRoutes } from './routes/systemRoutes.js';
import { registerAdminRoutes } from './routes/adminRoutes.js';
import { registerExampleRoutes } from './routes/exampleRoutes.js';
import routeReloader from './utils/routeReloader.js';

// 加载环境变量
dotenv.config();

const PORT = parseInt(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const API_CONFIG_PATH = process.env.API_CONFIG_PATH || './api_config (1).json';

/**
 * 创建 Fastify 实例（优化配置）
 */
const fastify = Fastify({
  logger: {
    level: LOG_LEVEL
  },

  // 性能优化配置
  ignoreTrailingSlash: true,
  caseSensitive: false,
  requestIdLogLabel: 'reqId',
  disableRequestLogging: false,

  // 请求限制
  bodyLimit: 1048576, // 1MB
  keepAliveTimeout: 72000, // 72秒

  // 连接优化
  connectionTimeout: 10000,
  pluginTimeout: 10000,

  // 信任代理（如果在 Nginx/ALB 后面）
  trustProxy: true
});

/**
 * 注册插件
 */
async function registerPlugins() {
  // CORS 支持
  await fastify.register(cors, {
    origin: true, // 允许所有来源（生产环境建议限制）
    credentials: true
  });

  // 响应压缩（减少带宽）
  await fastify.register(compress, {
    global: true,
    threshold: 1024, // 只压缩 > 1KB 的响应
    encodings: ['gzip', 'deflate']
  });

  console.log('✅ 插件注册完成');
}

/**
 * 启动服务器
 */
async function start() {
  try {
    console.log('🚀 启动 Kewen SQL API Server...');
    console.log('');

    // 1. 注册插件
    await registerPlugins();

    // 2. 初始化数据库连接池
    await poolManager.initialize(process.env);

    // 3. 注册系统路由
    console.log('📝 注册系统路由...');
    registerSystemRoutes(fastify);

    // 4. 注册管理路由
    console.log('📝 注册管理路由...');
    registerAdminRoutes(fastify);

    // 5. 注册示例代码路由
    console.log('📝 注册示例代码路由...');
    registerExampleRoutes(fastify);

    // 6. 自动注册 API 路由
    console.log('📝 注册 API 路由...');
    await registerAutoRoutes(fastify, API_CONFIG_PATH);

    // 7. 初始化路由重载器
    console.log('🔧 初始化路由重载器...');
    routeReloader.initialize(fastify, API_CONFIG_PATH);

    // 6. 启动 HTTP 服务器
    await fastify.listen({ port: PORT, host: HOST });

    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ 服务器启动成功！`);
    console.log(`🌐 地址: http://${HOST}:${PORT}`);
    console.log(`📊 健康检查: http://${HOST}:${PORT}/health`);
    console.log(`📝 环境: ${process.env.NODE_ENV || 'development'}`);
    console.log(`💾 内存占用: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
}

/**
 * 优雅关闭
 */
async function gracefulShutdown(signal) {
  console.log(`\n🛑 收到 ${signal} 信号，开始优雅关闭...`);

  try {
    // 1. 停止接受新请求
    await fastify.close();
    console.log('✅ HTTP 服务器已关闭');

    // 2. 关闭数据库连接池
    await poolManager.closeAll();

    console.log('✅ 优雅关闭完成');
    process.exit(0);
  } catch (error) {
    console.error('❌ 优雅关闭失败:', error);
    process.exit(1);
  }
}

// 监听退出信号
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// 捕获未处理的异常
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ 未处理的 Promise 拒绝:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ 未捕获的异常:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// 启动服务器
start();
