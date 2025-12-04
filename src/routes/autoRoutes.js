/**
 * 动态路由处理器
 * 使用单个通配符路由动态处理所有API请求
 * 支持真正的热加载 - 无需重启服务
 */

import fs from 'fs/promises';
import path from 'path';
import { executeApiTask } from '../database/executor.js';
import { validateParams, mergeParams } from '../database/queryParser.js';

// 配置缓存
let configCache = null;
let lastLoadTime = 0;
const CACHE_TTL = 1000; // 缓存1秒，平衡性能和实时性

/**
 * 加载API配置（带缓存）
 */
async function loadApiConfig(configPath) {
  const now = Date.now();

  // 如果缓存存在且未过期，直接返回
  if (configCache && (now - lastLoadTime) < CACHE_TTL) {
    return configCache;
  }

  try {
    const absolutePath = path.resolve(configPath);
    const content = await fs.readFile(absolutePath, 'utf-8');
    const config = JSON.parse(content);

    // 更新缓存
    configCache = config;
    lastLoadTime = now;

    return config;
  } catch (error) {
    console.error('❌ 加载API配置失败:', error.message);
    // 如果加载失败但有旧缓存，返回旧缓存
    if (configCache) {
      console.log('⚠️  使用缓存的配置');
      return configCache;
    }
    throw error;
  }
}

/**
 * 清空配置缓存（用于热加载）
 */
export function clearConfigCache() {
  configCache = null;
  lastLoadTime = 0;
  console.log('🔄 配置缓存已清空');
}

/**
 * 根据路径查找API配置
 */
async function findApiByPath(configPath, requestPath) {
  const config = await loadApiConfig(configPath);

  // 移除开头的斜杠进行匹配
  const normalizedPath = requestPath.startsWith('/') ? requestPath.substring(1) : requestPath;

  // 查找匹配的API
  const api = config.api.find(a => {
    const apiPath = a.path.startsWith('/') ? a.path.substring(1) : a.path;
    return apiPath === normalizedPath && a.status === 1;
  });

  return api;
}

/**
 * 确定 HTTP 方法
 */
function determineHttpMethod(apiParams, contentType) {
  // 1. 优先检查 contentType
  // 如果明确指定了需要请求体的 contentType，则使用 POST
  if (contentType === 'application/json' || contentType === 'application/x-www-form-urlencoded') {
    return 'POST';
  }

  // 2. 然后检查是否有参数
  if (!apiParams || apiParams === '[]') {
    return 'GET';
  }

  try {
    const params = JSON.parse(apiParams);
    if (!Array.isArray(params) || params.length === 0) {
      return 'GET';
    }
  } catch (e) {
    return 'GET';
  }

  // 3. 有参数默认使用 POST
  return 'POST';
}

/**
 * 注册动态路由处理器
 */
export async function registerAutoRoutes(fastify, configPath) {
  // 注册一个通配符路由来捕获所有API请求
  fastify.all('/:apiPath', {
    schema: {
      summary: '动态API路由处理器',
      description: '根据配置动态执行API请求',
      tags: ['API']
    },
    handler: async (request, reply) => {
      const requestPath = request.params.apiPath;

      // 排除系统路由和管理路由（这些由其他路由处理）
      if (requestPath.startsWith('admin') || requestPath === 'health') {
        return reply.code(404).send({
          success: false,
          error: 'NotFound',
          message: `路径 "/${requestPath}" 不存在`
        });
      }

      try {
        // 动态查找API配置
        const api = await findApiByPath(configPath, requestPath);

        if (!api) {
          return reply.code(404).send({
            success: false,
            error: 'NotFound',
            message: `API路径 "/${requestPath}" 不存在或已禁用`
          });
        }

        // 验证HTTP方法
        const expectedMethod = determineHttpMethod(api.params, api.contentType);
        if (request.method !== expectedMethod) {
          return reply.code(405).send({
            success: false,
            error: 'MethodNotAllowed',
            message: `API "${api.name}" 仅支持 ${expectedMethod} 方法`
          });
        }

        // 合并所有参数
        const requestParams = mergeParams(request);

        // 参数验证
        const validation = validateParams(api.params, requestParams);
        if (!validation.valid) {
          return reply.code(400).send({
            error: 'ParameterValidationError',
            message: '参数验证失败',
            details: validation.errors
          });
        }

        // 执行SQL任务
        const result = await executeApiTask(api.task, requestParams);

        // 返回结果
        return reply.send({
          success: true,
          data: result
        });

      } catch (error) {
        console.error(`❌ API执行失败 [/${requestPath}]:`, error.message);

        return reply.code(500).send({
          success: false,
          error: error.name || 'InternalServerError',
          message: error.message
        });
      }
    }
  });

  // 初始加载配置并显示统计
  try {
    const config = await loadApiConfig(configPath);
    const enabledApis = config.api.filter(a => a.status === 1);
    console.log(`✅ 动态路由处理器已注册`);
    console.log(`📋 可用API数量: ${enabledApis.length} 个`);
    console.log(`🔥 支持热加载: 修改配置立即生效`);
  } catch (error) {
    console.error('❌ 初始化动态路由处理器失败:', error);
  }
}
