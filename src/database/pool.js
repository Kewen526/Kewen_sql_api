/**
 * 数据库连接池管理器
 * 支持多数据源、连接池复用、自动重连
 * 优化内存占用和并发性能
 */

import mysql from 'mysql2/promise';

class DatabasePoolManager {
  constructor() {
    this.pools = new Map();
    this.datasourceMapping = {
      'YYKtG9Dv': 'DB1', // 产品/订单库
      'ukG1SAgu': 'DB2', // 采购库
      'q45gsAZj': 'DB3'  // 任务库
    };
  }

  /**
   * 初始化所有数据库连接池
   */
  async initialize(config) {
    console.log('🔌 初始化数据库连接池...');

    for (const [datasourceId, envPrefix] of Object.entries(this.datasourceMapping)) {
      const poolConfig = {
        host: config[`${envPrefix}_HOST`],
        port: parseInt(config[`${envPrefix}_PORT`]) || 3306,
        user: config[`${envPrefix}_USER`],
        password: config[`${envPrefix}_PASSWORD`],
        database: config[`${envPrefix}_DATABASE`],

        // 连接池配置 - 优化内存和并发
        connectionLimit: parseInt(config[`${envPrefix}_POOL_MAX`]) || 30, // 增加到30以支持多SQL并发
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
        timezone: '+08:00' // 东八区
      };

      try {
        const pool = mysql.createPool(poolConfig);

        // 测试连接
        const connection = await pool.getConnection();
        console.log(`✅ 数据源 ${datasourceId} (${poolConfig.database}) 连接成功`);
        connection.release();

        this.pools.set(datasourceId, pool);
      } catch (error) {
        console.error(`❌ 数据源 ${datasourceId} 连接失败:`, error.message);
        console.warn(`⚠️  数据源 ${datasourceId} 将被跳过，相关API将无法使用`);
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
}

// 单例模式
const poolManager = new DatabasePoolManager();

export default poolManager;
