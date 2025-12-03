/**
 * 自动路由生成器
 * 从 api_config.json 自动生成所有 API 路由
 */

import fs from 'fs/promises';
import path from 'path';
import { executeApiTask } from '../database/executor.js';
import { validateParams, mergeParams } from '../database/queryParser.js';

/**
 * 加载API配置
 */
async function loadApiConfig(configPath) {
  try {
    const absolutePath = path.resolve(configPath);
    const content = await fs.readFile(absolutePath, 'utf-8');
    const config = JSON.parse(content);

    console.log(`📋 加载API配置: ${config.api.length} 个接口`);
    return config;
  } catch (error) {
    console.error('❌ 加载API配置失败:', error.message);
    throw error;
  }
}

/**
 * 注册所有API路由
 */
export async function registerAutoRoutes(fastify, configPath) {
  const config = await loadApiConfig(configPath);

  let registeredCount = 0;
  let skippedCount = 0;

  for (const api of config.api) {
    // 跳过禁用的API
    if (api.status !== 1) {
      skippedCount++;
      continue;
    }

    try {
      await registerSingleRoute(fastify, api);
      registeredCount++;
    } catch (error) {
      console.error(`❌ 注册路由失败 [${api.path}]:`, error.message);
      skippedCount++;
    }
  }

  console.log(`✅ 路由注册完成: ${registeredCount} 个启用, ${skippedCount} 个跳过`);
}

/**
 * 注册单个API路由
 */
async function registerSingleRoute(fastify, api) {
  const {
    id,
    name,
    path: apiPath,
    contentType,
    params: apiParams,
    task,
    note
  } = api;

  // 确保路径以 / 开头
  const routePath = apiPath.startsWith('/') ? apiPath : `/${apiPath}`;

  // 根据 contentType 确定 HTTP 方法
  const method = determineHttpMethod(apiParams, contentType);

  // 路由配置
  const routeOptions = {
    method,
    url: routePath,
    schema: buildSchema(name, note, apiParams, contentType),
    handler: async (request, reply) => {
      try {
        // 合并所有参数（query、body、params）
        const requestParams = mergeParams(request);

        // 参数验证
        const validation = validateParams(apiParams, requestParams);
        if (!validation.valid) {
          return reply.code(400).send({
            error: 'ParameterValidationError',
            message: '参数验证失败',
            details: validation.errors
          });
        }

        // 执行SQL任务
        const result = await executeApiTask(task, requestParams);

        // 返回结果
        return reply.send({
          success: true,
          data: result
        });
      } catch (error) {
        console.error(`❌ API执行失败 [${routePath}]:`, error.message);

        return reply.code(500).send({
          success: false,
          error: error.name || 'InternalServerError',
          message: error.message
        });
      }
    }
  };

  // 注册路由
  fastify.route(routeOptions);

  console.log(`  ✓ ${method.padEnd(6)} ${routePath.padEnd(50)} ${name}`);
}

/**
 * 确定 HTTP 方法
 */
function determineHttpMethod(apiParams, contentType) {
  // 如果没有参数，使用 GET
  if (!apiParams || apiParams === '[]' || JSON.parse(apiParams || '[]').length === 0) {
    return 'GET';
  }

  // 根据 contentType 确定方法
  if (contentType === 'application/json') {
    return 'POST';
  } else if (contentType === 'application/x-www-form-urlencoded') {
    return 'POST';
  }

  // 默认 POST
  return 'POST';
}

/**
 * 构建 Fastify Schema（用于文档和验证）
 * 简化版本，避免因参数类型不标准导致的验证失败
 */
function buildSchema(name, note, apiParams, contentType) {
  // 只返回基本的文档信息，不添加参数验证
  // 参数验证在 handler 中通过 validateParams 函数手动完成
  const schema = {
    summary: name,
    description: note || name,
    tags: ['API']
  };

  return schema;
}
