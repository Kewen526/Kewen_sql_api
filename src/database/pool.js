/**
 * 数据库连接池管理器
 * 支持多数据源、连接池复用、自动重连、动态添加数据源
 * 优化内存占用和并发性能
 */

import mysql from 'mysql2/promise';
import datasourceManager from '../utils/datasourceManager.js';

class DatabasePoolManager {
  constructor() {
    this.pools = new Map();
  }

  /**
   * 初始化所有数据库连接池
   */
  async initialize(config) {
    console.log('🔌 初始化数据库连接池...');

    // 从 datasourceManager 读取所有数据源配置
    const datasources = await datasourceManager.getAllDatasources(config);

    for (const ds of datasources) {
      const poolConfig = {
        host: ds.host,
        port: ds.port,
        user: ds.user,
        password: ds.password,
        database: ds.database,

        // 连接池配置 - 优化内存和并发
        connectionLimit: ds.poolMax || 30, // 增加到30以支持多SQL并发
        queueLimit: 0, // 不限制队列，避免拒绝请求
        waitForConnections: true,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,

        // 超时配置
        connectTimeout: parseInt(config.DB_CONNECT_TIMEOUT) || 10000,

        // 性能优化
        multipleStatements: true, // 支持多语句执行（事务需要）
        namedPlaceholders: false,  // 使用 ? 占位符（我们会手动处理 #{} ）
        dateStrings: true,         // 日期作为字符串返回，避免转换开销

        // 字符集
        charset: 'utf8mb4',
        timezone: '+08:00', // 东八区

        // 类型转换：修复用户变量返回Buffer的问题
        // MySQL用户变量(@variable)在SELECT时可能被识别为BLOB类型
        // 需要手动转换为字符串，否则会以Buffer形式返回
        typeCast: function(field, next) {
          // BLOB 和 VAR_STRING 类型统一转为字符串
          if (field.type === 'BLOB' || field.type === 'VAR_STRING') {
            return field.string();
          }
          // 其他类型使用默认转换
          return next();
        }
      };

      try {
        const pool = mysql.createPool(poolConfig);

        // 测试连接
        const connection = await pool.getConnection();
        console.log(`✅ 数据源 ${ds.id} (${ds.name} - ${poolConfig.database}) 连接成功`);
        connection.release();

        this.pools.set(ds.id, pool);
      } catch (error) {
        console.error(`❌ 数据源 ${ds.id} (${ds.name}) 连接失败:`, error.message);
        console.warn(`⚠️  数据源 ${ds.id} 将被跳过，相关API将无法使用`);
        // 不抛出错误，继续初始化其他数据源
      }
    }

    console.log(`🎉 所有数据库连接池初始化完成 (${this.pools.size}个数据源)`);
  }

  /**
   * 获取指定数据源的连接池
   */
  getPool(datasourceId) {
    const pool = this.pools.get(datasourceId);
    if (!pool) {
      throw new Error(`数据源 ${datasourceId} 不存在`);
    }
    return pool;
  }

  /**
   * 执行SQL查询（单条）
   */
  async query(datasourceId, sql, params = []) {
    const pool = this.getPool(datasourceId);
    try {
      const [rows] = await pool.execute(sql, params);
      return rows;
    } catch (error) {
      console.error(`❌ SQL执行失败 [${datasourceId}]:`, error.message);
      console.error('SQL:', sql);
      console.error('参数:', params);
      throw error;
    }
  }

  /**
   * 执行事务（多条SQL）
   */
  async executeTransaction(datasourceId, sqlList, params = {}) {
    const pool = this.getPool(datasourceId);
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const results = [];
      for (const sqlItem of sqlList) {
        const { sql, sqlParams } = sqlItem;
        const [rows] = await connection.execute(sql, sqlParams);
        results.push(rows);
      }

      await connection.commit();
      return results;
    } catch (error) {
      await connection.rollback();
      console.error(`❌ 事务执行失败 [${datasourceId}]:`, error.message);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * 优雅关闭所有连接池
   */
  async closeAll() {
    console.log('🔌 关闭所有数据库连接池...');

    for (const [datasourceId, pool] of this.pools.entries()) {
      try {
        await pool.end();
        console.log(`✅ 数据源 ${datasourceId} 已关闭`);
      } catch (error) {
        console.error(`❌ 数据源 ${datasourceId} 关闭失败:`, error.message);
      }
    }

    this.pools.clear();
    console.log('✅ 所有连接池已关闭');
  }

  /**
   * 获取连接池状态
   */
  getStatus() {
    const status = {};
    for (const [datasourceId, pool] of this.pools.entries()) {
      status[datasourceId] = {
        totalConnections: pool.pool._allConnections.length,
        freeConnections: pool.pool._freeConnections.length,
        queueLength: pool.pool._connectionQueue.length
      };
    }
    return status;
  }

  /**
   * 动态添加新的数据源连接池
   * @param {Object} dsConfig - 数据源配置
   * @returns {boolean} 是否添加成功
   */
  async addDatasourcePool(dsConfig) {
    try {
      const poolConfig = {
        host: dsConfig.host,
        port: parseInt(dsConfig.port) || 3306,
        user: dsConfig.user,
        password: dsConfig.password,
        database: dsConfig.database,
        connectionLimit: dsConfig.poolMax || 30,
        queueLimit: 0,
        waitForConnections: true,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
        connectTimeout: 10000,
        multipleStatements: true,
        namedPlaceholders: false,
        dateStrings: true,
        charset: 'utf8mb4',
        timezone: '+08:00',

        // 类型转换：修复用户变量返回Buffer的问题
        typeCast: function(field, next) {
          if (field.type === 'BLOB' || field.type === 'VAR_STRING') {
            return field.string();
          }
          return next();
        }
      };

      const pool = mysql.createPool(poolConfig);

      // 测试连接
      const connection = await pool.getConnection();
      console.log(`✅ 新数据源 ${dsConfig.id} (${dsConfig.name}) 连接成功`);
      connection.release();

      this.pools.set(dsConfig.id, pool);
      return true;
    } catch (error) {
      console.error(`❌ 新数据源 ${dsConfig.id} 连接失败:`, error.message);
      throw error;
    }
  }

  /**
   * 动态删除数据源连接池
   * @param {string} datasourceId - 数据源ID
   * @returns {boolean} 是否删除成功
   */
  async removeDatasourcePool(datasourceId) {
    const pool = this.pools.get(datasourceId);
    if (!pool) {
      console.warn(`⚠️  数据源 ${datasourceId} 不存在`);
      return false;
    }

    try {
      await pool.end();
      this.pools.delete(datasourceId);
      console.log(`✅ 数据源 ${datasourceId} 连接池已关闭并删除`);
      return true;
    } catch (error) {
      console.error(`❌ 数据源 ${datasourceId} 关闭失败:`, error.message);
      throw error;
    }
  }

  /**
   * 重新加载数据源连接池
   * @param {string} datasourceId - 数据源ID
   * @param {Object} dsConfig - 新的数据源配置
   * @returns {boolean} 是否重新加载成功
   */
  async reloadDatasourcePool(datasourceId, dsConfig) {
    // 先删除旧的连接池
    await this.removeDatasourcePool(datasourceId);
    // 再添加新的连接池
    await this.addDatasourcePool(dsConfig);
    return true;
  }
}

// 单例模式
const poolManager = new DatabasePoolManager();

export default poolManager;
