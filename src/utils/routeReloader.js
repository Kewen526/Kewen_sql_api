/**
 * 配置缓存管理器
 * 负责清空API配置缓存，实现真正的热加载
 */

import { clearConfigCache } from '../routes/autoRoutes.js';

class RouteReloader {
  constructor() {
    this.initialized = false;
  }

  /**
   * 初始化（保持兼容性）
   */
  initialize(fastify, configPath) {
    this.initialized = true;
    console.log('📌 配置缓存管理器已初始化');
  }

  /**
   * 重新加载API路由（实际上是清空缓存）
   */
  async reload() {
    if (!this.initialized) {
      console.warn('⚠️  配置缓存管理器未初始化');
    }

    try {
      const startTime = Date.now();

      // 清空配置缓存
      clearConfigCache();

      const duration = Date.now() - startTime;

      console.log(`✅ 配置缓存已清空！下次请求将重新加载配置`);
      console.log(`   - 耗时: ${duration}ms`);

      return {
        success: true,
        message: '配置缓存已清空，新配置将在下次请求时生效',
        duration: `${duration}ms`
      };
    } catch (error) {
      console.error('❌ 清空配置缓存失败:', error);
      return {
        success: false,
        message: '清空配置缓存失败: ' + error.message,
        error: error.stack
      };
    }
  }
}

export default new RouteReloader();
