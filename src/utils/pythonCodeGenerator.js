/**
 * Python 示例代码生成器
 * 根据API配置自动生成Python调用示例代码
 */

class PythonCodeGenerator {
  /**
   * 生成完整的Python示例代码
   * @param {Object} api - API配置
   * @param {string} baseUrl - 基础URL
   * @returns {Object} 包含三个版本的示例代码
   */
  generateExample(api, baseUrl = 'http://47.104.72.198:3000') {
    const {
      name,
      path: apiPath,
      contentType,
      params: apiParams,
      testParams
    } = api;

    // 解析参数
    const params = this._parseParams(apiParams);
    const exampleParams = this._parseTestParams(testParams);
    const method = this._determineMethod(params, contentType);

    return {
      basic: this._generateBasicExample(name, apiPath, method, exampleParams, contentType, baseUrl),
      full: this._generateFullExample(name, apiPath, method, exampleParams, contentType, baseUrl),
      async: this._generateAsyncExample(name, apiPath, method, exampleParams, contentType, baseUrl)
    };
  }

  /**
   * 生成基础版示例（最简单）
   */
  _generateBasicExample(name, apiPath, method, exampleParams, contentType, baseUrl) {
    const functionName = this._pathToFunctionName(apiPath);
    // 确保apiPath以斜杠开头
    const normalizedPath = apiPath.startsWith('/') ? apiPath : `/${apiPath}`;
    const url = `${baseUrl}${normalizedPath}`;

    if (method === 'GET') {
      return `import requests

def ${functionName}():
    """${name}"""
    url = "${url}"

    response = requests.get(url)
    result = response.json()

    return result

# 使用示例
if __name__ == "__main__":
    result = ${functionName}()
    print(result)`;
    } else {
      // POST - 统一使用 JSON 格式（更通用，避免 415 错误）
      const paramsStr = JSON.stringify(exampleParams, null, 4);

      return `import requests

def ${functionName}(${this._generateParamSignature(exampleParams)}):
    """${name}"""
    url = "${url}"

    payload = ${paramsStr}

    response = requests.post(url, json=payload)
    result = response.json()

    return result

# 使用示例
if __name__ == "__main__":
    result = ${functionName}(${this._generateParamCall(exampleParams)})
    print(result)`;
    }
  }

  /**
   * 生成完整版示例（包含错误处理、重试、代理禁用）
   */
  _generateFullExample(name, apiPath, method, exampleParams, contentType, baseUrl) {
    const functionName = this._pathToFunctionName(apiPath);
    // 确保apiPath以斜杠开头
    const normalizedPath = apiPath.startsWith('/') ? apiPath : `/${apiPath}`;
    const url = `${baseUrl}${normalizedPath}`;
    const paramsStr = JSON.stringify(exampleParams, null, 4);

    if (method === 'GET') {
      return `import os
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# 禁用系统代理
os.environ['NO_PROXY'] = '*'
os.environ['no_proxy'] = '*'
os.environ['HTTP_PROXY'] = ''
os.environ['HTTPS_PROXY'] = ''
os.environ['http_proxy'] = ''
os.environ['https_proxy'] = ''

def ${functionName}():
    """
    ${name}

    Returns:
        dict: API返回的数据
    """
    url = "${url}"

    # 配置重试策略
    retry_strategy = Retry(
        total=3,
        backoff_factor=1,
        status_forcelist=[429, 500, 502, 503, 504]
    )

    # 创建session，禁用代理
    session = requests.Session()
    session.proxies = {
        'http': None,
        'https': None
    }
    session.trust_env = False

    adapter = HTTPAdapter(max_retries=retry_strategy)
    session.mount("http://", adapter)
    session.mount("https://", adapter)

    try:
        response = session.get(url, timeout=30)
        response.raise_for_status()

        result = response.json()

        if result.get('success'):
            return result.get('data')
        else:
            print(f"❌ API返回错误: {result.get('message')}")
            return None

    except requests.exceptions.Timeout:
        print(f"❌ 请求超时: {url}")
        return None

    except requests.exceptions.ConnectionError as e:
        print(f"❌ 连接错误: {e}")
        return None

    except requests.exceptions.HTTPError as e:
        print(f"❌ HTTP错误: {e}")
        return None

    except requests.exceptions.RequestException as e:
        print(f"❌ 请求异常: {e}")
        return None

    except ValueError as e:
        print(f"❌ JSON解析错误: {e}")
        return None

    finally:
        session.close()

# 使用示例
if __name__ == "__main__":
    result = ${functionName}()

    if result:
        print("✅ 获取成功！")
        print(result)
    else:
        print("❌ 获取失败！")`;
    } else {
      // POST - 统一使用 JSON 格式（更通用，避免 415 错误）
      return `import os
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import json

# 禁用系统代理
os.environ['NO_PROXY'] = '*'
os.environ['no_proxy'] = '*'
os.environ['HTTP_PROXY'] = ''
os.environ['HTTPS_PROXY'] = ''
os.environ['http_proxy'] = ''
os.environ['https_proxy'] = ''

def ${functionName}(${this._generateParamSignature(exampleParams)}):
    """
    ${name}

    Args:
${this._generateParamDocs(exampleParams)}

    Returns:
        dict: API返回的数据
    """
    url = "${url}"

    # 请求参数
    payload = ${paramsStr}

    # 配置重试策略
    retry_strategy = Retry(
        total=3,
        backoff_factor=1,
        status_forcelist=[429, 500, 502, 503, 504]
    )

    # 创建session，禁用代理
    session = requests.Session()
    session.proxies = {
        'http': None,
        'https': None
    }
    session.trust_env = False

    adapter = HTTPAdapter(max_retries=retry_strategy)
    session.mount("http://", adapter)
    session.mount("https://", adapter)

    try:
        response = session.post(
            url,
            json=payload,
            timeout=30
        )

        response.raise_for_status()

        result = response.json()

        if result.get('success'):
            return result.get('data')
        else:
            print(f"❌ API返回错误: {result.get('message')}")
            return None

    except requests.exceptions.Timeout:
        print(f"❌ 请求超时: {url}")
        return None

    except requests.exceptions.ConnectionError as e:
        print(f"❌ 连接错误: {e}")
        return None

    except requests.exceptions.HTTPError as e:
        print(f"❌ HTTP错误: {e}")
        print(f"响应状态码: {response.status_code}")
        print(f"响应内容: {response.text}")
        return None

    except requests.exceptions.RequestException as e:
        print(f"❌ 请求异常: {e}")
        return None

    except ValueError as e:
        print(f"❌ JSON解析错误: {e}")
        return None

    finally:
        session.close()

# 使用示例
if __name__ == "__main__":
    result = ${functionName}(${this._generateParamCall(exampleParams)})

    if result:
        print("✅ 获取成功！")
        print(json.dumps(result, indent=2, ensure_ascii=False))
    else:
        print("❌ 获取失败！")`;
    }
  }

  /**
   * 生成异步版示例（使用aiohttp）
   */
  _generateAsyncExample(name, apiPath, method, exampleParams, contentType, baseUrl) {
    const functionName = this._pathToFunctionName(apiPath);
    // 确保apiPath以斜杠开头
    const normalizedPath = apiPath.startsWith('/') ? apiPath : `/${apiPath}`;
    const url = `${baseUrl}${normalizedPath}`;
    const paramsStr = JSON.stringify(exampleParams, null, 4);

    if (method === 'GET') {
      return `import asyncio
import aiohttp

async def ${functionName}():
    """${name}（异步版本）"""
    url = "${url}"

    timeout = aiohttp.ClientTimeout(total=30)

    async with aiohttp.ClientSession(timeout=timeout) as session:
        try:
            async with session.get(url) as response:
                response.raise_for_status()
                result = await response.json()

                if result.get('success'):
                    return result.get('data')
                else:
                    print(f"❌ API返回错误: {result.get('message')}")
                    return None

        except asyncio.TimeoutError:
            print(f"❌ 请求超时: {url}")
            return None
        except aiohttp.ClientError as e:
            print(f"❌ 请求错误: {e}")
            return None

# 使用示例
async def main():
    result = await ${functionName}()
    if result:
        print("✅ 获取成功！")
        print(result)
    else:
        print("❌ 获取失败！")

if __name__ == "__main__":
    asyncio.run(main())`;
    } else {
      // POST - 统一使用 JSON 格式（更通用，避免 415 错误）
      return `import asyncio
import aiohttp
import json

async def ${functionName}(${this._generateParamSignature(exampleParams)}):
    """
    ${name}（异步版本）

    Args:
${this._generateParamDocs(exampleParams)}

    Returns:
        dict: API返回的数据
    """
    url = "${url}"

    payload = ${paramsStr}

    timeout = aiohttp.ClientTimeout(total=30)

    async with aiohttp.ClientSession(timeout=timeout) as session:
        try:
            async with session.post(url, json=payload) as response:
                response.raise_for_status()
                result = await response.json()

                if result.get('success'):
                    return result.get('data')
                else:
                    print(f"❌ API返回错误: {result.get('message')}")
                    return None

        except asyncio.TimeoutError:
            print(f"❌ 请求超时: {url}")
            return None
        except aiohttp.ClientError as e:
            print(f"❌ 请求错误: {e}")
            return None

# 使用示例
async def main():
    result = await ${functionName}(${this._generateParamCall(exampleParams)})
    if result:
        print("✅ 获取成功！")
        print(json.dumps(result, indent=2, ensure_ascii=False))
    else:
        print("❌ 获取失败！")

if __name__ == "__main__":
    asyncio.run(main())`;
    }
  }

  /**
   * 将API路径转换为函数名
   */
  _pathToFunctionName(apiPath) {
    // 移除开头的斜杠，转换为下划线命名
    return apiPath.replace(/^\//, '').replace(/[/-]/g, '_');
  }

  /**
   * 解析参数
   */
  _parseParams(apiParams) {
    if (!apiParams) return [];

    try {
      if (typeof apiParams === 'string') {
        return JSON.parse(apiParams);
      }
      return apiParams;
    } catch (e) {
      return [];
    }
  }

  /**
   * 解析测试参数
   */
  _parseTestParams(testParams) {
    if (!testParams) return {};

    try {
      if (typeof testParams === 'string') {
        return JSON.parse(testParams);
      }
      return testParams;
    } catch (e) {
      return {};
    }
  }

  /**
   * 确定HTTP方法（与运行时逻辑保持一致）
   */
  _determineMethod(params, contentType) {
    // 1. 优先检查 contentType（与 autoRoutes.js 逻辑一致）
    if (contentType === 'application/json' || contentType === 'application/x-www-form-urlencoded') {
      return 'POST';
    }

    // 2. 再检查参数
    if (!params || params.length === 0) {
      return 'GET';
    }

    return 'POST';
  }

  /**
   * 生成函数参数签名
   */
  _generateParamSignature(exampleParams) {
    const keys = Object.keys(exampleParams);
    if (keys.length === 0) return '';

    return keys.map(key => `${key}=None`).join(', ');
  }

  /**
   * 生成函数调用参数
   */
  _generateParamCall(exampleParams) {
    const entries = Object.entries(exampleParams);
    if (entries.length === 0) return '';

    return entries.map(([key, value]) => {
      if (typeof value === 'string') {
        return `${key}="${value}"`;
      }
      return `${key}=${value}`;
    }).join(', ');
  }

  /**
   * 生成参数文档
   */
  _generateParamDocs(exampleParams) {
    const entries = Object.entries(exampleParams);
    if (entries.length === 0) return '        无参数';

    return entries.map(([key, value]) => {
      const type = typeof value;
      return `        ${key} (${type}): ${key}参数`;
    }).join('\n');
  }
}

export default new PythonCodeGenerator();
