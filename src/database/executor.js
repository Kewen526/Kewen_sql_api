/**
 * SQL执行器
 * 支持事务和非事务执行
 */

import poolManager from './pool.js';
import { parseSql } from './queryParser.js';

/**
 * 执行API任务
 */
export async function executeApiTask(taskConfig, requestParams) {
  const tasks = typeof taskConfig === 'string' ? JSON.parse(taskConfig) : taskConfig;

  // 支持多个任务（但通常只有一个）
  const results = [];

  for (const task of tasks) {
    const { datasourceId, sqlList, transaction } = task;

    if (transaction === 1) {
      // 事务执行
      const result = await executeTransaction(datasourceId, sqlList, requestParams);
      results.push(result);
    } else {
      // 非事务执行
      const result = await executeNonTransaction(datasourceId, sqlList, requestParams);
      results.push(result);
    }
  }

  // 如果只有一个任务，返回该任务的结果
  // 如果有多个SQL，返回最后一个SQL的结果（DBAPI的行为）
  if (results.length === 1) {
    return results[0];
  }

  return results;
}

/**
 * 执行事务（多个SQL在同一个事务中）
 */
async function executeTransaction(datasourceId, sqlList, requestParams) {
  const pool = poolManager.getPool(datasourceId);
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    let lastResult = null;

    for (const sqlItem of sqlList) {
      const { sqlText } = sqlItem;

      // 解析SQL和参数
      const { sql, params } = parseSql(sqlText, requestParams);

      // 执行SQL
      const [rows] = await connection.execute(sql, params);
      lastResult = rows;
    }

    await connection.commit();

    // 返回最后一个SQL的结果
    return formatResult(lastResult);
  } catch (error) {
    await connection.rollback();
    console.error(`❌ 事务执行失败 [${datasourceId}]:`, error.message);
    throw error;
  } finally {
    // ✅ 释放连接前清理会话变量，防止连接池复用时的变量污染
    await cleanupSessionVariables(connection);
    connection.release();
  }
}

/**
 * 执行非事务（多个SQL在同一连接中顺序执行，但不开启事务）
 *
 * 重要：即使不开启事务，也必须在同一个连接中执行所有SQL
 * 原因：MySQL会话变量（@variable）只在同一连接的同一会话中有效
 * 例如：SET @v_id := NULL; SELECT ... INTO @v_id; 必须在同一连接中
 */
async function executeNonTransaction(datasourceId, sqlList, requestParams) {
  const pool = poolManager.getPool(datasourceId);
  const connection = await pool.getConnection();  // ✅ 获取一个连接

  try {
    let lastResult = null;

    for (const sqlItem of sqlList) {
      const { sqlText } = sqlItem;

      // 解析SQL和参数
      const { sql, params } = parseSql(sqlText, requestParams);

      // ✅ 在同一个连接上执行所有SQL（保证@变量有效）
      const [rows] = await connection.execute(sql, params);
      lastResult = rows;
    }

    // 返回最后一个SQL的结果
    return formatResult(lastResult);
  } catch (error) {
    console.error(`❌ SQL执行失败 [${datasourceId}]:`, error.message);
    throw error;
  } finally {
    // ✅ 释放连接前清理会话变量，防止连接池复用时的变量污染
    await cleanupSessionVariables(connection);
    connection.release();  // ✅ 最后释放连接
  }
}

/**
 * 格式化结果
 * 兼容 DBAPI 的返回格式
 */
function formatResult(rows) {
  // 如果是 INSERT/UPDATE/DELETE，返回影响行数
  if (rows && typeof rows === 'object' && 'affectedRows' in rows) {
    return {
      affectedRows: rows.affectedRows,
      insertId: rows.insertId,
      warningCount: rows.warningCount
    };
  }

  // 如果是 SELECT，返回结果集
  if (Array.isArray(rows)) {
    // 单行结果，直接返回对象
    if (rows.length === 1) {
      return rows[0];
    }
    // 多行结果，返回数组
    return rows;
  }

  // 其他情况，原样返回
  return rows;
}

/**
 * 清理会话变量
 *
 * 防止连接池复用时的会话变量污染问题：
 * 当连接被释放回连接池后，MySQL的会话变量（@variable）不会被清除
 * 下一个请求复用该连接时，如果SQL中的 SELECT...INTO 没有找到记录
 * 变量不会被赋新值，会保留上一次请求的旧值，导致数据错误
 *
 * 解决方案：在释放连接前执行 RESET CONNECTION（MySQL 5.7.3+）
 * 该命令会重置会话状态，包括：
 * - 清除所有用户变量（@variable）
 * - 清除临时表
 * - 重置会话变量为默认值
 * - 清除 PREPARE 语句
 *
 * @param {Connection} connection - MySQL连接对象
 */
async function cleanupSessionVariables(connection) {
  try {
    // 使用 RESET CONNECTION 重置会话状态（MySQL 5.7.3+）
    // 注意：不要使用 query，必须使用 resetConnection() 方法
    // 因为 mysql2 库对此做了特殊处理
    if (typeof connection.resetConnection === 'function') {
      await connection.resetConnection();
    } else {
      // 降级方案：手动清理（适用于旧版本MySQL或不支持的客户端）
      // 注意：这只是尽力而为，无法完全清理所有会话状态
      console.warn('⚠️  连接不支持 resetConnection()，跳过会话清理');
    }
  } catch (error) {
    // 清理失败不应该影响主流程，只记录警告
    console.warn('⚠️  会话变量清理失败:', error.message);
  }
}
