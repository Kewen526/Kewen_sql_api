/**
 * 管理后端 API
 * 提供 API 配置的增删改查功能
 */

import configManager from '../utils/configManager.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * 注册管理路由
 */
export function registerAdminRoutes(fastify) {
  // 获取所有 API 列表
  fastify.get('/admin/apis', {
    schema: {
      summary: '获取所有API配置',
      tags: ['Admin']
    },
    handler: async (request, reply) => {
      try {
        const apis = await configManager.getAllApis();

        // 简化返回数据
        const simpleApis = apis.map(api => {
          const task = JSON.parse(api.task || '[{}]')[0] || {};
          const params = JSON.parse(api.params || '[]');

          return {
            id: api.id,
            name: api.name,
            path: api.path,
            note: api.note,
            contentType: api.contentType,
            groupId: api.groupId,
            params,
            datasourceId: task.datasourceId,
            transaction: task.transaction,
            sqlText: task.sqlList?.[0]?.sqlText || '',
            status: api.status,
            createTime: api.createTime,
            updateTime: api.updateTime
          };
        });

        return {
          success: true,
          data: simpleApis,
          total: simpleApis.length
        };
      } catch (error) {
        return reply.code(500).send({
          success: false,
          message: error.message
        });
      }
    }
  });

  // 获取单个 API
  fastify.get('/admin/apis/:id', {
    schema: {
      summary: '获取单个API详情',
      tags: ['Admin']
    },
    handler: async (request, reply) => {
      try {
        const api = await configManager.getApiById(request.params.id);

        if (!api) {
          return reply.code(404).send({
            success: false,
            message: 'API不存在'
          });
        }

        const task = JSON.parse(api.task || '[{}]')[0] || {};
        const params = JSON.parse(api.params || '[]');

        return {
          success: true,
          data: {
            id: api.id,
            name: api.name,
            path: api.path,
            note: api.note,
            contentType: api.contentType,
            groupId: api.groupId,
            params,
            datasourceId: task.datasourceId,
            transaction: task.transaction,
            sqlText: task.sqlList?.[0]?.sqlText || ''
          }
        };
      } catch (error) {
        return reply.code(500).send({
          success: false,
          message: error.message
        });
      }
    }
  });

  // 创建新 API
  fastify.post('/admin/apis', {
    schema: {
      summary: '创建新API',
      tags: ['Admin'],
      body: {
        type: 'object',
        required: ['name', 'path', 'groupId', 'datasourceId', 'sqlText'],
        properties: {
          name: { type: 'string' },
          path: { type: 'string' },
          note: { type: 'string' },
          contentType: { type: 'string' },
          groupId: { type: 'string' },
          datasourceId: { type: 'string' },
          sqlText: { type: 'string' },
          params: { type: 'array' },
          transaction: { type: 'number' }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const newApi = await configManager.createApi(request.body);

        return {
          success: true,
          message: 'API创建成功！请重启服务器使其生效。',
          data: newApi
        };
      } catch (error) {
        return reply.code(500).send({
          success: false,
          message: error.message
        });
      }
    }
  });

  // 更新 API
  fastify.put('/admin/apis/:id', {
    schema: {
      summary: '更新API',
      tags: ['Admin']
    },
    handler: async (request, reply) => {
      try {
        const updatedApi = await configManager.updateApi(request.params.id, request.body);

        return {
          success: true,
          message: 'API更新成功！请重启服务器使其生效。',
          data: updatedApi
        };
      } catch (error) {
        return reply.code(500).send({
          success: false,
          message: error.message
        });
      }
    }
  });

  // 删除 API
  fastify.delete('/admin/apis/:id', {
    schema: {
      summary: '删除API',
      tags: ['Admin']
    },
    handler: async (request, reply) => {
      try {
        await configManager.deleteApi(request.params.id);

        return {
          success: true,
          message: 'API删除成功！请重启服务器使其生效。'
        };
      } catch (error) {
        return reply.code(500).send({
          success: false,
          message: error.message
        });
      }
    }
  });

  // 获取分组列表
  fastify.get('/admin/groups', {
    schema: {
      summary: '获取分组列表',
      tags: ['Admin']
    },
    handler: async (request, reply) => {
      return {
        success: true,
        data: configManager.getGroups()
      };
    }
  });

  // 获取数据源列表
  fastify.get('/admin/datasources', {
    schema: {
      summary: '获取数据源列表',
      tags: ['Admin']
    },
    handler: async (request, reply) => {
      return {
        success: true,
        data: configManager.getDatasources()
      };
    }
  });

  // 重启服务器（使用 PM2）
  fastify.post('/admin/restart', {
    schema: {
      summary: '重启服务器',
      tags: ['Admin']
    },
    handler: async (request, reply) => {
      try {
        // 使用 PM2 重启
        await execAsync('pm2 restart kewen-sql-api');

        return {
          success: true,
          message: '服务器重启命令已发送'
        };
      } catch (error) {
        return reply.code(500).send({
          success: false,
          message: '重启失败: ' + error.message,
          hint: '请手动运行: pm2 restart kewen-sql-api'
        });
      }
    }
  });

  console.log('  ✓ GET    /admin/apis                                        获取所有API');
  console.log('  ✓ GET    /admin/apis/:id                                    获取单个API');
  console.log('  ✓ POST   /admin/apis                                        创建API');
  console.log('  ✓ PUT    /admin/apis/:id                                    更新API');
  console.log('  ✓ DELETE /admin/apis/:id                                    删除API');
  console.log('  ✓ GET    /admin/groups                                      获取分组');
  console.log('  ✓ GET    /admin/datasources                                 获取数据源');
  console.log('  ✓ POST   /admin/restart                                     重启服务器');
}
