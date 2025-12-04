/**
 * 示例代码路由
 * 提供API调用示例代码（Python、JavaScript等）
 */

import configManager from '../utils/configManager.js';
import pythonCodeGenerator from '../utils/pythonCodeGenerator.js';

/**
 * 注册示例代码路由
 */
export function registerExampleRoutes(fastify) {
  // 获取指定API的Python示例代码
  fastify.get('/admin/apis/:id/example', {
    schema: {
      summary: '获取API的Python调用示例',
      tags: ['Admin']
    },
    handler: async (request, reply) => {
      try {
        const { id } = request.params;
        const { version = 'full' } = request.query;

        // 获取API配置
        const api = await configManager.getApiById(id);

        if (!api) {
          return reply.code(404).send({
            success: false,
            message: 'API不存在'
          });
        }

        // 生成Python示例代码
        const baseUrl = process.env.BASE_URL || 'http://47.104.72.198:3000';
        const examples = pythonCodeGenerator.generateExample(api, baseUrl);

        // 根据version参数返回指定版本
        const versionMap = {
          'basic': examples.basic,
          'full': examples.full,
          'async': examples.async
        };

        const selectedExample = versionMap[version] || examples.full;

        return {
          success: true,
          data: {
            apiId: id,
            apiName: api.name,
            apiPath: api.path,
            version,
            examples: {
              basic: examples.basic,
              full: examples.full,
              async: examples.async
            },
            selected: selectedExample
          }
        };
      } catch (error) {
        console.error('生成示例代码失败:', error);
        return reply.code(500).send({
          success: false,
          message: '生成示例代码失败: ' + error.message
        });
      }
    }
  });

  console.log('  ✓ GET    /admin/apis/:id/example                           获取API调用示例');
}
