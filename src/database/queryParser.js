/**
 * SQL参数化查询解析器
 * 支持 MyBatis 风格的 #{param} 占位符和 <foreach> 标签
 * 防止SQL注入
 */

/**
 * 解析 MyBatis 风格的 SQL
 * 将 #{param} 转换为 ? 占位符，并提取参数值
 */
export function parseSql(sqlText, params) {
  // 处理 <foreach> 标签
  let processedSql = processForeachTags(sqlText, params);

  // 提取所有 #{paramName} 占位符
  const paramMatches = [];
  const placeholderRegex = /#\{([^}]+)\}/g;
  let match;

  while ((match = placeholderRegex.exec(processedSql)) !== null) {
    paramMatches.push(match[1].trim());
  }

  // 将 #{paramName} 替换为 ?
  const preparedSql = processedSql.replace(/#\{[^}]+\}/g, '?');

  // 按顺序提取参数值
  const paramValues = paramMatches.map(paramName => {
    // 支持嵌套属性，例如: #{item.id}
    const value = getNestedValue(params, paramName);
    return value !== undefined ? value : null;
  });

  return {
    sql: preparedSql,
    params: paramValues
  };
}

/**
 * 处理 <foreach> 标签
 * 示例: <foreach collection="orderIdList" item="orderId" separator="," open="(" close=")">#{orderId}</foreach>
 */
function processForeachTags(sqlText, params) {
  const foreachRegex = /<foreach\s+collection="([^"]+)"\s+item="([^"]+)"\s+separator="([^"]*)"\s*(?:open="([^"]*)")?\s*(?:close="([^"]*)")?\s*>([^<]+)<\/foreach>/g;

  return sqlText.replace(foreachRegex, (match, collection, item, separator, open = '', close = '', innerTemplate) => {
    const collectionData = params[collection];

    if (!Array.isArray(collectionData) || collectionData.length === 0) {
      return ''; // 空数组，返回空字符串
    }

    // 为每个元素生成SQL片段
    const fragments = collectionData.map(value => {
      // 创建临时参数对象
      const tempParams = { [item]: value };
      // 替换内部模板中的占位符
      return innerTemplate.replace(/#\{([^}]+)\}/g, (m, paramName) => {
        if (paramName === item) {
          return `#{${collection}_${collectionData.indexOf(value)}}`;
        }
        return m;
      });
    });

    // 将数组值扁平化到参数对象中
    collectionData.forEach((value, index) => {
      params[`${collection}_${index}`] = value;
    });

    return open + fragments.join(separator) + close;
  });
}

/**
 * 获取嵌套对象的值
 * 例如: getNestedValue({a: {b: 1}}, 'a.b') => 1
 */
function getNestedValue(obj, path) {
  const keys = path.split('.');
  let value = obj;

  for (const key of keys) {
    if (value === null || value === undefined) {
      return undefined;
    }
    value = value[key];
  }

  return value;
}

/**
 * 验证参数类型
 */
export function validateParams(apiParams, requestParams) {
  const errors = [];

  if (!apiParams || apiParams.length === 0) {
    return { valid: true, errors: [] };
  }

  const paramDefinitions = typeof apiParams === 'string' ? JSON.parse(apiParams) : apiParams;

  for (const paramDef of paramDefinitions) {
    const { name, type, note } = paramDef;
    const value = requestParams[name];

    // 检查必填参数
    if (value === undefined || value === null || value === '') {
      errors.push(`缺少必填参数: ${name}${note ? ` (${note})` : ''}`);
      continue;
    }

    // 类型验证
    if (type === 'string' && typeof value !== 'string') {
      errors.push(`参数 ${name} 应为字符串类型`);
    } else if (type === 'number' && isNaN(Number(value))) {
      errors.push(`参数 ${name} 应为数字类型`);
    } else if (type === 'float' && isNaN(parseFloat(value))) {
      errors.push(`参数 ${name} 应为浮点数类型`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 合并参数（支持 query、body、params）
 */
export function mergeParams(request) {
  return {
    ...request.query,
    ...request.params,
    ...request.body
  };
}
