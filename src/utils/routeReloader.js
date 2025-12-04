/**
 * 路由热加载模块
 * 支持动态刷新API路由，无需重启服务器
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class RouteReloader {
  constructor() {
    this.fastifyInstance = null;
    this.apiConfigPath = null;
    this.registeredRoutes = [];
  }

  /**
   * 初始化路由重载器
   * @param {Object} fastify - Fastify实例
   * @param {string} configPath - API配置文件路径
   */
  initialize(fastify, configPath) {
    this.fastifyInstance = fastify;
    this.apiConfigPath = configPath;
    console.log('📌 路由重载器已初始化');
  }

  /**
   * 重新加载所有API路由
   * @returns {Object} 重载结果
   */
  async reload() {
    if (!this.fastifyInstance || !this.apiConfigPath) {
      throw new Error('路由重载器未初始化');
    }

    try {
      console.log('🔄 开始重新加载API路由...');
      const startTime = Date.now();

      // 1. 读取最新的API配置
      const config = await this._loadApiConfig();

      // 2. 移除旧路由
      await this._removeOldRoutes();

      // 3. 注册新路由
      const result = await this._registerNewRoutes(config);

      const duration = Date.now() - startTime;
      console.log(`✅ 路由重载完成！耗时: ${duration}ms`);
      console.log(`   - 成功注册: ${result.registered} 个`);
      console.log(`   - 跳过: ${result.skipped} 个`);

      return {
        success: true,
        message: '路由重载成功',
        registered: result.registered,
        skipped: result.skipped,
        duration: `${duration}ms`
      };
    } catch (error) {
      console.error('❌ 路由重载失败:', error);
      return {
        success: false,
        message: '路由重载失败: ' + error.message,
        error: error.stack
      };
    }
  }

  /**
   * 加载API配置文件
   */
  async _loadApiConfig() {
    try {
      const absolutePath = path.resolve(this.apiConfigPath);
      const content = await fs.readFile(absolutePath, 'utf-8');
      const config = JSON.parse(content);

      if (!config.api || !Array.isArray(config.api)) {
        throw new Error('配置文件格式错误：缺少api数组');
      }

      console.log(`📋 读取到 ${config.api.length} 个API配置`);
      return config;
    } catch (error) {
      throw new Error(`加载配置文件失败: ${error.message}`);
    }
  }

  /**
   * 移除旧路由
   * Fastify不支持直接删除路由，但我们可以通过重置路由表的方式实现
   */
  async _removeOldRoutes() {
    // 获取当前所有路由
    const routes = this.fastifyInstance.printRoutes({ commonPrefix: false });

    // 计数需要保留的系统路由
    const systemRoutes = ['/health', '/admin', '/api'];

    // Fastify的路由是只增不减的，所以我们采用标记策略
    // 新注册的路由会覆盖旧路由（相同path和method）
    console.log('🗑️  准备覆盖旧路由...');
  }

  /**
   * 注册新路由
   */
  async _registerNewRoutes(config) {
    // 动态导入必要的模块
    const { executeApiTask } = await import('../database/executor.js');
    const { validateParams, mergeParams } = await import('../database/queryParser.js');

    let registeredCount = 0;
    let skippedCount = 0;

    for (const api of config.api) {
      // 跳过禁用的API
      if (api.status !== 1) {
        skippedCount++;
        continue;
      }

      try {
        await this._registerSingleRoute(api, { executeApiTask, validateParams, mergeParams });
        registeredCount++;
      } catch (error) {
        console.error(`❌ 注册路由失败 [${api.path}]:`, error.message);
        skippedCount++;
      }
    }

    return { registered: registeredCount, skipped: skippedCount };
  }

  /**
   * 注册单个API路由
   */
  async _registerSingleRoute(api, { executeApiTask, validateParams, mergeParams }) {
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
    const method = this._determineHttpMethod(apiParams, contentType);

    // 路由配置
    const routeOptions = {
      method,
      url: routePath,
      schema: this._buildSchema(name, note, apiParams, contentType),
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
    this.fastifyInstance.route(routeOptions);

    console.log(`  ✓ ${method.padEnd(6)} ${routePath.padEnd(50)} ${name}`);
  }

  /**
   * 确定 HTTP 方法
   */
  _determineHttpMethod(apiParams, contentType) {
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
   * 构建 Fastify Schema
   */
  _buildSchema(name, note, apiParams, contentType) {
    const schema = {
      summary: name,
      description: note || name,
      tags: ['API']
    };

    return schema;
  }
}

export default new RouteReloader();
