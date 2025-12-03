#!/usr/bin/env node

/**
 * API 文档生成器
 * 从 api_config (1).json 生成完整的 HTML 文档
 */

const fs = require('fs');
const path = require('path');

// 读取 API 配置
const configPath = path.join(__dirname, 'api_config (1).json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

// 分组映射
const groupNames = {
  'yTMWJ8W3': 'gocrm',
  'H1BFe93S': '采购IW',
  'j2pRZs0O': '跟单IW'
};

// 解析 API 数据
function parseApis() {
  const apis = config.api
    .filter(api => api.status === 1)
    .map(api => {
      const params = api.params ? JSON.parse(api.params) : [];
      const task = api.task ? JSON.parse(api.task)[0] : {};

      // 确定 HTTP 方法
      const method = determineMethod(params, api.contentType);

      // 生成示例参数
      const example = generateExample(params, api.jsonParam);

      return {
        id: api.id,
        name: api.name,
        path: api.path,
        method,
        contentType: api.contentType || 'application/x-www-form-urlencoded',
        group: groupNames[api.groupId] || '其他',
        groupId: api.groupId,
        params,
        example,
        note: api.note || api.name,
        transaction: task.transaction === 1,
        datasourceId: task.datasourceId
      };
    });

  return apis;
}

function determineMethod(params, contentType) {
  if (!params || params.length === 0) {
    return 'GET';
  }
  return 'POST';
}

function generateExample(params, jsonParam) {
  if (jsonParam) {
    try {
      return JSON.parse(jsonParam);
    } catch (e) {
      // 忽略解析错误
    }
  }

  const example = {};
  params.forEach(param => {
    if (param.type === 'string') {
      example[param.name] = 'example_value';
    } else if (param.type === 'number' || param.type === 'float') {
      example[param.name] = 123;
    }
  });

  return example;
}

// 生成 HTML
function generateHtml(apis) {
  // 按组分类
  const groups = {};
  apis.forEach(api => {
    if (!groups[api.group]) {
      groups[api.group] = [];
    }
    groups[api.group].push(api);
  });

  const groupsHtml = Object.entries(groups).map(([groupName, groupApis]) => `
    <div class="api-group">
      <div class="group-header">
        ${groupName} (${groupApis.length} 个接口)
      </div>
      ${groupApis.map(api => generateApiHtml(api)).join('')}
    </div>
  `).join('');

  return generateFullHtml(apis.length, groupsHtml);
}

function generateApiHtml(api) {
  const methodClass = api.method === 'GET' ? 'method-get' : 'method-post';

  const paramsHtml = api.params && api.params.length > 0 ? `
    <div class="detail-section">
      <div class="detail-title">📌 请求参数</div>
      <div class="detail-content">
        <table class="param-table">
          <thead>
            <tr>
              <th>参数名</th>
              <th>类型</th>
              <th>说明</th>
            </tr>
          </thead>
          <tbody>
            ${api.params.map(p => `
              <tr>
                <td><code>${p.name}</code></td>
                <td><span class="param-type">${p.type}</span></td>
                <td>${p.note || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  ` : '<div class="detail-section"><div class="detail-title">📌 请求参数</div><div class="detail-content">无参数</div></div>';

  const curlExample = generateCurlExample(api);
  const exampleData = api.example && Object.keys(api.example).length > 0
    ? JSON.stringify(api.example, null, 2)
    : '// 无参数';

  return `
    <div class="api-item">
      <div class="api-header" onclick="this.parentElement.classList.toggle('active')">
        <span class="api-method ${methodClass}">${api.method}</span>
        <span class="api-path">/${api.path}</span>
        <span class="api-name">${api.name}</span>
        ${api.transaction ? '<span class="badge badge-transaction">事务</span>' : ''}
        <span class="api-toggle">▼</span>
      </div>
      <div class="api-details">
        <div class="detail-section">
          <div class="detail-title">📝 接口说明</div>
          <div class="detail-content">${api.note}</div>
        </div>

        <div class="detail-section">
          <div class="detail-title">🌐 完整地址</div>
          <div class="detail-content">
            <div class="code-block">http://47.104.72.198:3000/${api.path}</div>
            <button class="copy-btn" onclick="copyText('http://47.104.72.198:3000/${api.path}')">复制地址</button>
          </div>
        </div>

        <div class="detail-section">
          <div class="detail-title">📋 Content-Type</div>
          <div class="detail-content">${api.contentType}</div>
        </div>

        ${paramsHtml}

        <div class="detail-section">
          <div class="detail-title">📤 请求示例数据</div>
          <div class="detail-content">
            <div class="code-block">${exampleData}</div>
          </div>
        </div>

        <div class="detail-section">
          <div class="detail-title">💻 cURL 命令</div>
          <div class="detail-content">
            <div class="code-block">${escapeHtml(curlExample)}</div>
            <button class="copy-btn" onclick="copyText(\`${curlExample.replace(/`/g, '\\`')}\`)">复制命令</button>
          </div>
        </div>

        <div class="detail-section">
          <div class="detail-title">✅ 成功响应示例</div>
          <div class="detail-content">
            <div class="code-block">{
  "success": true,
  "data": {
    // 返回的数据
  }
}</div>
          </div>
        </div>

        <div class="detail-section">
          <div class="detail-title">❌ 错误响应示例</div>
          <div class="detail-content">
            <div class="code-block">{
  "success": false,
  "error": "ErrorType",
  "message": "错误描述"
}</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function generateCurlExample(api) {
  let curl = `curl -X ${api.method} http://47.104.72.198:3000/${api.path}`;

  if (api.contentType) {
    curl += ` \\\n  -H "Content-Type: ${api.contentType}"`;
  }

  if (api.example && Object.keys(api.example).length > 0) {
    if (api.contentType === 'application/json') {
      curl += ` \\\n  -d '${JSON.stringify(api.example)}'`;
    } else {
      const params = Object.entries(api.example).map(([k, v]) => `${k}=${v}`).join('&');
      curl += ` \\\n  -d "${params}"`;
    }
  }

  return curl;
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function generateFullHtml(totalCount, groupsHtml) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kewen SQL API 接口文档</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
            background: #f5f7fa;
            color: #333;
            line-height: 1.6;
        }

        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .container { max-width: 1400px; margin: 0 auto; }

        .header h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
        .header .subtitle { opacity: 0.9; font-size: 1.1rem; margin-bottom: 1rem; }

        .header .info {
            margin-top: 1.5rem;
            padding: 1.5rem;
            background: rgba(255,255,255,0.1);
            border-radius: 8px;
            backdrop-filter: blur(10px);
        }

        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1rem;
            margin-top: 1rem;
        }

        .info-item {
            padding: 1rem;
            background: rgba(255,255,255,0.1);
            border-radius: 6px;
        }

        .info-item strong { display: block; margin-bottom: 0.5rem; font-size: 0.9rem; opacity: 0.9; }
        .info-item .value { font-size: 1.3rem; font-weight: bold; }

        .search-box {
            padding: 2rem;
            background: white;
            margin: 2rem auto;
            max-width: 1400px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .search-input {
            width: 100%;
            padding: 1rem 1.5rem;
            font-size: 1.1rem;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            outline: none;
            transition: all 0.3s;
        }

        .search-input:focus {
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .api-list { max-width: 1400px; margin: 0 auto 2rem; padding: 0 2rem; }

        .api-group { margin-bottom: 2rem; }

        .group-header {
            background: white;
            padding: 1rem 1.5rem;
            border-radius: 8px 8px 0 0;
            border-left: 4px solid #667eea;
            font-weight: bold;
            font-size: 1.2rem;
            color: #667eea;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        .api-item {
            background: white;
            margin-bottom: 0.5rem;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            overflow: hidden;
            transition: all 0.2s;
        }

        .api-item:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.12); }

        .api-header {
            padding: 1.5rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 1rem;
            background: linear-gradient(to right, #ffffff, #f8f9fa);
        }

        .api-method {
            padding: 0.4rem 0.9rem;
            border-radius: 4px;
            font-weight: bold;
            font-size: 0.85rem;
            min-width: 55px;
            text-align: center;
        }

        .method-get { background: #e3f2fd; color: #1976d2; border: 2px solid #bbdefb; }
        .method-post { background: #fff3e0; color: #f57c00; border: 2px solid #ffe0b2; }

        .api-path {
            flex: 1;
            font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
            font-size: 0.95rem;
            color: #667eea;
            font-weight: 500;
        }

        .api-name { color: #666; font-size: 0.95rem; }

        .badge {
            display: inline-block;
            padding: 0.3rem 0.7rem;
            border-radius: 3px;
            font-size: 0.75rem;
            font-weight: bold;
        }

        .badge-transaction { background: #e8f5e9; color: #2e7d32; border: 1px solid #c8e6c9; }

        .api-toggle {
            color: #999;
            font-size: 1.2rem;
            transition: transform 0.3s;
        }

        .api-item.active .api-toggle { transform: rotate(180deg); }

        .api-details {
            display: none;
            padding: 0 1.5rem 1.5rem;
            background: #fafafa;
        }

        .api-item.active .api-details { display: block; animation: slideDown 0.3s ease; }

        @keyframes slideDown {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .detail-section { margin-bottom: 1.5rem; }

        .detail-title {
            font-weight: bold;
            color: #667eea;
            margin-bottom: 0.7rem;
            font-size: 1rem;
        }

        .detail-content {
            background: white;
            padding: 1.2rem;
            border-radius: 6px;
            border: 1px solid #e0e0e0;
        }

        .code-block {
            background: #2d2d2d;
            color: #f8f8f2;
            padding: 1.2rem;
            border-radius: 6px;
            font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
            font-size: 0.85rem;
            overflow-x: auto;
            white-space: pre-wrap;
            word-break: break-all;
        }

        .param-table {
            width: 100%;
            border-collapse: collapse;
        }

        .param-table th,
        .param-table td {
            padding: 0.9rem;
            text-align: left;
            border-bottom: 1px solid #e0e0e0;
        }

        .param-table th {
            background: #f8f9fa;
            font-weight: bold;
            color: #666;
            font-size: 0.9rem;
        }

        .param-table td { font-size: 0.9rem; }

        .param-type {
            display: inline-block;
            padding: 0.3rem 0.7rem;
            background: #e8eaf6;
            color: #5c6bc0;
            border-radius: 3px;
            font-size: 0.8rem;
            font-weight: bold;
        }

        .copy-btn {
            background: #667eea;
            color: white;
            border: none;
            padding: 0.6rem 1.2rem;
            border-radius: 5px;
            cursor: pointer;
            font-size: 0.85rem;
            margin-top: 0.7rem;
            transition: all 0.2s;
            font-weight: 500;
        }

        .copy-btn:hover { background: #5568d3; transform: translateY(-1px); }
        .copy-btn:active { background: #4c5ed1; transform: translateY(0); }

        .no-results {
            text-align: center;
            padding: 4rem;
            color: #999;
            font-size: 1.2rem;
        }

        .footer {
            text-align: center;
            padding: 3rem 2rem;
            color: #999;
            font-size: 0.9rem;
            background: white;
            margin-top: 2rem;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="container">
            <h1>🚀 Kewen SQL API 接口文档</h1>
            <div class="subtitle">高性能低内存 SQL API 服务器 - 完全替代 DBAPI</div>
            <div class="info">
                <div class="info-grid">
                    <div class="info-item">
                        <strong>🌐 服务地址</strong>
                        <div class="value">http://47.104.72.198:3000</div>
                    </div>
                    <div class="info-item">
                        <strong>📊 总接口数</strong>
                        <div class="value">${totalCount} 个</div>
                    </div>
                    <div class="info-item">
                        <strong>📅 版本</strong>
                        <div class="value">v1.0.0</div>
                    </div>
                    <div class="info-item">
                        <strong>🔧 技术栈</strong>
                        <div class="value">Fastify + MySQL2</div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="search-box">
        <input type="text" id="searchInput" class="search-input" placeholder="🔍 搜索接口名称、路径或功能描述...">
    </div>

    <div class="api-list" id="apiList">
        ${groupsHtml}
    </div>

    <div class="no-results" id="noResults" style="display: none;">
        😢 未找到匹配的接口
    </div>

    <div class="footer">
        <div>© 2025 Kewen SQL API Server</div>
        <div style="margin-top: 0.5rem; font-size: 0.85rem;">
            Powered by Node.js + Fastify + MySQL2 |
            <a href="https://github.com/Kewen526/Kewen_sql_api" style="color: #667eea;">GitHub</a>
        </div>
    </div>

    <script>
        // 复制文本到剪贴板
        function copyText(text) {
            navigator.clipboard.writeText(text).then(() => {
                alert('✅ 已复制到剪贴板！');
            }).catch(err => {
                console.error('复制失败:', err);
                // 降级方案
                const textarea = document.createElement('textarea');
                textarea.value = text;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                alert('✅ 已复制到剪贴板！');
            });
        }

        // 搜索功能
        const searchInput = document.getElementById('searchInput');
        const apiList = document.getElementById('apiList');
        const noResults = document.getElementById('noResults');

        searchInput.addEventListener('input', (e) => {
            const keyword = e.target.value.toLowerCase().trim();
            const groups = document.querySelectorAll('.api-group');
            let totalVisible = 0;

            groups.forEach(group => {
                const items = group.querySelectorAll('.api-item');
                let groupVisible = 0;

                items.forEach(item => {
                    const text = item.textContent.toLowerCase();
                    if (keyword === '' || text.includes(keyword)) {
                        item.style.display = '';
                        groupVisible++;
                        totalVisible++;
                    } else {
                        item.style.display = 'none';
                    }
                });

                // 如果组内没有可见项，隐藏整个组
                group.style.display = groupVisible > 0 ? '' : 'none';
            });

            // 显示或隐藏"无结果"提示
            apiList.style.display = totalVisible > 0 ? '' : 'none';
            noResults.style.display = totalVisible === 0 ? 'block' : 'none';
        });

        // 添加键盘快捷键 (Ctrl/Cmd + K 聚焦搜索框)
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                searchInput.focus();
            }
        });
    </script>
</body>
</html>`;
}

// 主函数
function main() {
  console.log('🚀 开始生成 API 文档...');

  const apis = parseApis();
  console.log(`📊 共找到 ${apis.length} 个接口`);

  const html = generateHtml(apis);

  const outputPath = path.join(__dirname, 'API_DOCS.html');
  fs.writeFileSync(outputPath, html, 'utf-8');

  console.log(`✅ 文档生成成功！`);
  console.log(`📁 文件位置: ${outputPath}`);
  console.log(`\n🌐 使用方法:`);
  console.log(`   1. 用浏览器打开 API_DOCS.html`);
  console.log(`   2. 或部署到服务器供团队使用`);
}

main();
