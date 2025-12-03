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

        // 返回完整数据，包含所有 SQL
        const fullApis = apis.map(api => ({
          id: api.id,
          name: api.name,
          path: api.path,
          note: api.note,
          contentType: api.contentType,
          groupId: api.groupId,
          params: api.paramsParsed,
          datasourceId: api.datasourceId,
          transaction: api.transaction,
          sqlList: api.sqlList,  // 完整的 SQL 列表
          status: api.status,
          createTime: api.createTime,
          updateTime: api.updateTime
        }));

        return {
          success: true,
          count: fullApis.length,
          apis: fullApis
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

        // getApiById 已经返回解析后的数据（包含 sqlList, datasourceId, transaction 等）
        return {
          success: true,
          data: {
            id: api.id,
            name: api.name,
            path: api.path,
            note: api.note,
            contentType: api.contentType,
            groupId: api.groupId,
            params: api.paramsParsed || [],
            datasourceId: api.datasourceId,
            transaction: api.transaction,
            sqlList: api.sqlList || [],  // ✅ 返回完整的 SQL 列表
            testParams: api.testParamsParsed || {},  // ✅ 返回测试参数
            status: api.status,
            createTime: api.createTime,
            updateTime: api.updateTime
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

  // 添加 SQL 到 API
  fastify.post('/admin/apis/:apiId/sql', {
    schema: {
      summary: '添加SQL到API',
      tags: ['Admin']
    },
    handler: async (request, reply) => {
      try {
        const { apiId } = request.params;
        const { sqlText } = request.body;

        if (!sqlText) {
          return reply.code(400).send({
            success: false,
            error: 'sqlText 不能为空'
          });
        }

        const newSql = await configManager.addSqlToApi(apiId, sqlText);

        return {
          success: true,
          message: 'SQL 添加成功',
          sql: newSql
        };
      } catch (error) {
        return reply.code(500).send({
          success: false,
          error: error.message
        });
      }
    }
  });

  // 更新特定 SQL
  fastify.put('/admin/apis/:apiId/sql/:sqlId', {
    schema: {
      summary: '更新特定SQL',
      tags: ['Admin']
    },
    handler: async (request, reply) => {
      try {
        const { apiId, sqlId } = request.params;
        const { sqlText } = request.body;

        if (!sqlText) {
          return reply.code(400).send({
            success: false,
            error: 'sqlText 不能为空'
          });
        }

        const updatedSql = await configManager.updateSql(apiId, sqlId, sqlText);

        return {
          success: true,
          message: 'SQL 更新成功',
          sql: updatedSql
        };
      } catch (error) {
        return reply.code(500).send({
          success: false,
          error: error.message
        });
      }
    }
  });

  // 删除特定 SQL
  fastify.delete('/admin/apis/:apiId/sql/:sqlId', {
    schema: {
      summary: '删除特定SQL',
      tags: ['Admin']
    },
    handler: async (request, reply) => {
      try {
        const { apiId, sqlId } = request.params;

        const deletedSql = await configManager.deleteSql(apiId, sqlId);

        return {
          success: true,
          message: 'SQL 删除成功',
          sql: deletedSql
        };
      } catch (error) {
        return reply.code(500).send({
          success: false,
          error: error.message
        });
      }
    }
  });

  // 测试执行 API（使用配置的测试参数）
  fastify.post('/admin/apis/:id/test-execute', {
    schema: {
      summary: '测试执行API（使用测试参数）',
      tags: ['Admin']
    },
    handler: async (request, reply) => {
      try {
        const { id } = request.params;
        const { testParams: overrideParams } = request.body || {};

        // 获取API配置
        const api = await configManager.getApiById(id);
        if (!api) {
          return reply.code(404).send({
            success: false,
            message: 'API不存在'
          });
        }

        // 使用传入的参数或配置的测试参数
        const testParams = overrideParams || api.testParamsParsed || {};

        // 动态导入 executor（避免循环依赖）
        const { executeApiTask } = await import('../database/executor.js');

        // 执行SQL
        const result = await executeApiTask(api.task, testParams);

        return {
          success: true,
          message: '测试执行成功',
          data: result,
          executedWith: testParams
        };
      } catch (error) {
        console.error('测试执行失败:', error);
        return reply.code(500).send({
          success: false,
          message: '测试执行失败: ' + error.message,
          error: error.stack
        });
      }
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
  console.log('  ✓ POST   /admin/apis/:apiId/sql                             添加SQL');
  console.log('  ✓ PUT    /admin/apis/:apiId/sql/:sqlId                      更新SQL');
  console.log('  ✓ DELETE /admin/apis/:apiId/sql/:sqlId                      删除SQL');
  console.log('  ✓ POST   /admin/apis/:id/test-execute                       测试执行API');
  console.log('  ✓ GET    /admin/groups                                      获取分组');
  console.log('  ✓ GET    /admin/datasources                                 获取数据源');
  console.log('  ✓ POST   /admin/restart                                     重启服务器');
}
