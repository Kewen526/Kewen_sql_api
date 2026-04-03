/**
 * HTTP代理执行器
 * 支持将API请求转发到外部HTTP服务
 * taskType: 2
 */

/**
 * 执行代理转发任务
 * @param {Object} task - 任务配置
 * @param {string} task.targetUrl - 目标URL
 * @param {string} task.method - HTTP方法 (GET/POST)
 * @param {string} task.targetContentType - 转发时使用的Content-Type
 * @param {Object} task.headers - 额外的请求头
 * @param {number} task.timeout - 超时时间(ms)，默认30000
 * @param {Object} requestParams - 请求参数
 * @returns {Promise<any>} 目标服务的响应
 */
export async function executeProxyTask(task, requestParams) {
  const {
    targetUrl,
    method = 'POST',
    targetContentType = 'application/json',
    headers = {},
    timeout = 30000
  } = task;

  if (!targetUrl) {
    throw new Error('代理任务缺少 targetUrl 配置');
  }

  // 构建请求选项
  const fetchOptions = {
    method: method.toUpperCase(),
    headers: {
      ...headers
    },
    signal: AbortSignal.timeout(timeout)
  };

  let finalUrl = targetUrl;

  if (method.toUpperCase() === 'GET') {
    // GET请求：参数拼接到URL
    const url = new URL(targetUrl);
    for (const [key, value] of Object.entries(requestParams)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, value);
      }
    }
    finalUrl = url.toString();
  } else {
    // POST请求：参数放到body
    if (targetContentType === 'application/x-www-form-urlencoded') {
      fetchOptions.headers['Content-Type'] = 'application/x-www-form-urlencoded';
      const formData = new URLSearchParams();
      for (const [key, value] of Object.entries(requestParams)) {
        if (value !== undefined && value !== null) {
          formData.set(key, value);
        }
      }
      fetchOptions.body = formData.toString();
    } else {
      // 默认 application/json
      fetchOptions.headers['Content-Type'] = 'application/json';
      fetchOptions.body = JSON.stringify(requestParams);
    }
  }

  console.log(`🔀 代理转发: ${method} ${finalUrl}`);

  try {
    const response = await fetch(finalUrl, fetchOptions);

    // 尝试解析JSON响应
    const contentType = response.headers.get('content-type') || '';
    let data;

    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // 如果目标服务返回错误状态码，仍然返回数据（让调用方处理）
    if (!response.ok) {
      console.warn(`⚠️  代理目标返回 ${response.status}: ${finalUrl}`);
    }

    return data;
  } catch (error) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      throw new Error(`代理转发超时 (${timeout}ms): ${finalUrl}`);
    }
    console.error(`❌ 代理转发失败 [${finalUrl}]:`, error.message);
    throw new Error(`代理转发失败: ${error.message}`);
  }
}
