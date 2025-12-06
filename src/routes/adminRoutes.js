/**
 * 管理后端 API
 * 提供 API 配置的增删改查功能
 * 提供数据源的增删改查功能
 */

import configManager from '../utils/configManager.js';
import datasourceManager from '../utils/datasourceManager.js';
import poolManager from '../database/pool.js';
import routeReloader from '../utils/routeReloader.js';
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
        required: ['name', 'path', 'groupId', 'datasourceId'],
        properties: {
          name: { type: 'string' },
          path: { type: 'string' },
          note: { type: 'string' },
          contentType: { type: 'string' },
          groupId: { type: 'string' },
          datasourceId: { type: 'string' },
          sqlText: { type: 'string' },
          sqlList: { type: 'array' },
          params: { type: 'array' },
          testParams: { type: 'object' },
          transaction: { type: 'number' }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const newApi = await configManager.createApi(request.body);

        // 🔥 自动触发路由热加载
        try {
          await routeReloader.reload();
        } catch (reloadError) {
          console.error('热加载失败:', reloadError);
          // 热加载失败不影响API创建成功
        }

        return {
          success: true,
          message: 'API创建成功，路由已自动更新！',
          data: newApi
        };
      } catch (error) {
        // 路径重复错误返回 400
        if (error.message.includes('已被') && error.message.includes('占用')) {
          return reply.code(400).send({
            success: false,
            message: error.message
          });
        }

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

        // 🔥 自动触发路由热加载
        try {
          await routeReloader.reload();
        } catch (reloadError) {
          console.error('热加载失败:', reloadError);
          // 热加载失败不影响API更新成功
        }

        return {
          success: true,
          message: 'API更新成功，路由已自动更新！',
          data: updatedApi
        };
      } catch (error) {
        // 路径重复错误返回 400
        if (error.message.includes('已被') && error.message.includes('占用')) {
          return reply.code(400).send({
            success: false,
            message: error.message
          });
        }

        // API不存在返回 404
        if (error.message === 'API不存在') {
          return reply.code(404).send({
            success: false,
            message: error.message
          });
        }

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

        // 🔥 自动触发路由热加载
        try {
          await routeReloader.reload();
        } catch (reloadError) {
          console.error('热加载失败:', reloadError);
          // 热加载失败不影响API删除成功
        }

        return {
          success: true,
          message: 'API删除成功，路由已自动更新！'
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
      const groups = await configManager.getGroups();
      return {
        success: true,
        data: groups
      };
    }
  });

  // 创建新分组
  fastify.post('/admin/groups', {
    schema: {
      summary: '创建新分组',
      tags: ['Admin'],
      body: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', description: '分组名称' },
          description: { type: 'string', description: '分组描述' },
          order: { type: 'number', description: '排序序号' }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const newGroup = await configManager.addGroup(request.body);
        return {
          success: true,
          data: newGroup,
          message: '分组创建成功'
        };
      } catch (error) {
        return reply.code(500).send({
          success: false,
          error: 'CreateGroupError',
          message: error.message
        });
      }
    }
  });

  // 更新分组
  fastify.put('/admin/groups/:groupId', {
    schema: {
      summary: '更新分组',
      tags: ['Admin'],
      params: {
        type: 'object',
        properties: {
          groupId: { type: 'string', description: '分组ID' }
        }
      },
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', description: '分组名称' },
          description: { type: 'string', description: '分组描述' },
          order: { type: 'number', description: '排序序号' }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const { groupId } = request.params;
        const updatedGroup = await configManager.updateGroup(groupId, request.body);
        return {
          success: true,
          data: updatedGroup,
          message: '分组更新成功'
        };
      } catch (error) {
        return reply.code(error.message === '分组不存在' ? 404 : 500).send({
          success: false,
          error: error.message === '分组不存在' ? 'GroupNotFound' : 'UpdateGroupError',
          message: error.message
        });
      }
    }
  });

  // 删除分组
  fastify.delete('/admin/groups/:groupId', {
    schema: {
      summary: '删除分组',
      tags: ['Admin'],
      params: {
        type: 'object',
        properties: {
          groupId: { type: 'string', description: '分组ID' }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const { groupId } = request.params;
        await configManager.deleteGroup(groupId);
        return {
          success: true,
          message: '分组删除成功'
        };
      } catch (error) {
        return reply.code(error.message === '分组不存在' ? 404 : 500).send({
          success: false,
          error: error.message === '分组不存在' ? 'GroupNotFound' : 'DeleteGroupError',
          message: error.message
        });
      }
    }
  });

  // 获取数据源列表
  fastify.get('/admin/datasources', {
    schema: {
      summary: '获取数据源列表',
      tags: ['Admin']
    },
    handler: async (request, reply) => {
      try {
        const datasources = await datasourceManager.getDatasourcesList();
        return {
          success: true,
          data: datasources
        };
      } catch (error) {
        return reply.code(500).send({
          success: false,
          message: error.message
        });
      }
    }
  });

  // 获取单个数据源详情
  fastify.get('/admin/datasources/:id', {
    schema: {
      summary: '获取单个数据源详情',
      tags: ['Admin']
    },
    handler: async (request, reply) => {
      try {
        const datasource = await datasourceManager.getDatasourceById(request.params.id);

        if (!datasource) {
          return reply.code(404).send({
            success: false,
            message: '数据源不存在'
          });
        }

        // 不返回密码
        const { password, ...safeData } = datasource;

        return {
          success: true,
          data: safeData
        };
      } catch (error) {
        return reply.code(500).send({
          success: false,
          message: error.message
        });
      }
    }
  });

  // 创建新数据源
  fastify.post('/admin/datasources', {
    schema: {
      summary: '创建新数据源',
      tags: ['Admin'],
      body: {
        type: 'object',
        required: ['name', 'host', 'user', 'password', 'database'],
        properties: {
          name: { type: 'string' },
          host: { type: 'string' },
          port: { type: 'number' },
          user: { type: 'string' },
          password: { type: 'string' },
          database: { type: 'string' },
          poolMin: { type: 'number' },
          poolMax: { type: 'number' }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const newDatasource = await datasourceManager.createDatasource(request.body);

        // 动态添加到连接池
        try {
          await poolManager.addDatasourcePool(newDatasource);
        } catch (poolError) {
          console.error('添加到连接池失败:', poolError.message);
          // 即使添加到连接池失败，数据源配置也已保存
        }

        // 不返回密码
        const { password, ...safeData } = newDatasource;

        return {
          success: true,
          message: '数据源创建成功',
          data: safeData
        };
      } catch (error) {
        return reply.code(500).send({
          success: false,
          message: error.message
        });
      }
    }
  });

  // 更新数据源
  fastify.put('/admin/datasources/:id', {
    schema: {
      summary: '更新数据源',
      tags: ['Admin']
    },
    handler: async (request, reply) => {
      try {
        const updatedDatasource = await datasourceManager.updateDatasource(
          request.params.id,
          request.body
        );

        // 重新加载连接池
        try {
          await poolManager.reloadDatasourcePool(request.params.id, updatedDatasource);
        } catch (poolError) {
          console.error('重新加载连接池失败:', poolError.message);
        }

        // 不返回密码
        const { password, ...safeData } = updatedDatasource;

        return {
          success: true,
          message: '数据源更新成功',
          data: safeData
        };
      } catch (error) {
        if (error.message === '数据源不存在') {
          return reply.code(404).send({
            success: false,
            message: error.message
          });
        }

        return reply.code(500).send({
          success: false,
          message: error.message
        });
      }
    }
  });

  // 删除数据源
  fastify.delete('/admin/datasources/:id', {
    schema: {
      summary: '删除数据源',
      tags: ['Admin']
    },
    handler: async (request, reply) => {
      try {
        await datasourceManager.deleteDatasource(request.params.id);

        // 从连接池中删除
        try {
          await poolManager.removeDatasourcePool(request.params.id);
        } catch (poolError) {
          console.error('从连接池删除失败:', poolError.message);
        }

        return {
          success: true,
          message: '数据源删除成功'
        };
      } catch (error) {
        if (error.message === '数据源不存在') {
          return reply.code(404).send({
            success: false,
            message: error.message
          });
        }

        return reply.code(500).send({
          success: false,
          message: error.message
        });
      }
    }
  });

  // 测试数据源连接
  fastify.post('/admin/datasources/test', {
    schema: {
      summary: '测试数据源连接',
      tags: ['Admin'],
      body: {
        type: 'object',
        required: ['host', 'user', 'password', 'database'],
        properties: {
          host: { type: 'string' },
          port: { type: 'number' },
          user: { type: 'string' },
          password: { type: 'string' },
          database: { type: 'string' }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const result = await datasourceManager.testConnection(request.body);

        if (result.success) {
          return {
            success: true,
            message: result.message,
            data: result.serverInfo
          };
        } else {
          return reply.code(400).send({
            success: false,
            message: result.message,
            error: result.error
          });
        }
      } catch (error) {
        return reply.code(500).send({
          success: false,
          message: '测试连接失败: ' + error.message
        });
      }
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

  // 临时测试执行 API（不需要保存，直接测试SQL）
  fastify.post('/admin/test-execute', {
    schema: {
      summary: '临时测试执行SQL（无需保存API）',
      tags: ['Admin'],
      body: {
        type: 'object',
        required: ['datasourceId', 'sqlList'],
        properties: {
          datasourceId: { type: 'string' },
          sqlList: { type: 'array' },
          testParams: { type: 'object' },
          transaction: { type: 'number' }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const { datasourceId, sqlList, testParams = {}, transaction = 0 } = request.body;

        // 构造临时task配置
        const tempTask = [{
          taskType: 1,
          datasourceId,
          sqlList: sqlList.map(sql => ({
            transformPlugin: null,
            transformPluginParam: null,
            sqlText: sql.sqlText || sql,
            id: sql.id || 'temp'
          })),
          transaction
        }];

        // 动态导入 executor
        const { executeApiTask } = await import('../database/executor.js');

        // 执行SQL
        const result = await executeApiTask(tempTask, testParams);

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

  // 刷新API配置（热加载）
  fastify.post('/admin/restart', {
    schema: {
      summary: '刷新API配置（热加载）',
      tags: ['Admin']
    },
    handler: async (request, reply) => {
      try {
        // 清空配置缓存
        console.log('🔄 清空API配置缓存...');
        const result = await routeReloader.reload();

        if (result.success) {
          return {
            success: true,
            message: `配置缓存已清空！下次请求将使用最新配置，耗时 ${result.duration}`,
            method: 'cache-clear',
            details: result
          };
        } else {
          throw new Error(result.message);
        }
      } catch (error) {
        console.error('清空配置缓存失败:', error);

        return reply.code(500).send({
          success: false,
          message: '清空配置缓存失败: ' + error.message,
          hint: '如需完全重启，请手动执行: docker restart kewen-sql-api'
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
  console.log('  ✓ POST   /admin/test-execute                                临时测试执行SQL');
  console.log('  ✓ POST   /admin/apis/:id/test-execute                       测试执行API');
  console.log('  ✓ GET    /admin/groups                                      获取分组');
  console.log('  ✓ GET    /admin/datasources                                 获取数据源列表');
  console.log('  ✓ GET    /admin/datasources/:id                             获取单个数据源');
  console.log('  ✓ POST   /admin/datasources                                 创建数据源');
  console.log('  ✓ PUT    /admin/datasources/:id                             更新数据源');
  console.log('  ✓ DELETE /admin/datasources/:id                             删除数据源');
  console.log('  ✓ POST   /admin/datasources/test                            测试数据源连接');
  console.log('  ✓ POST   /admin/restart                                     重启服务器');
}
