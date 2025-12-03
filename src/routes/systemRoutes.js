/**
 * 系统路由
 * 包括健康检查、状态监控等
 */

import poolManager from '../database/pool.js';

/**
 * 注册系统路由
 */
export function registerSystemRoutes(fastify) {
  // 健康检查
  fastify.get('/health', {
    schema: {
      summary: '健康检查',
      description: '检查服务器和数据库连接状态',
      tags: ['System']
    },
    handler: async (request, reply) => {
      try {
        const poolStatus = poolManager.getStatus();

        return {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          memory: {
            used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
            total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
            rss: Math.round(process.memoryUsage().rss / 1024 / 1024)
          },
          database: poolStatus
        };
      } catch (error) {
        return reply.code(503).send({
          status: 'unhealthy',
          error: error.message
        });
      }
    }
  });

  // 根路径
  fastify.get('/', {
    schema: {
      summary: 'API 服务器信息',
      tags: ['System']
    },
    handler: async (request, reply) => {
      return {
        name: 'Kewen SQL API Server',
        version: '1.0.0',
        description: '高性能低内存SQL API服务器',
        endpoints: {
          health: '/health',
          docs: '/documentation'
        }
      };
    }
  });

  console.log('  ✓ GET    /                                                   API 服务器信息');
  console.log('  ✓ GET    /health                                             健康检查');
}
