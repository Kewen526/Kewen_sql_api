/**
 * 简单的文档服务器
 * 在服务器上运行，通过浏览器访问 API 文档
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// 静态文件服务
app.use(express.static(__dirname));

// 文档首页
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'API_DOCS.html'));
});

// 管理界面
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('📚 API 文档服务器启动成功！');
  console.log(`🌐 文档地址: http://localhost:${PORT}`);
  console.log(`🛠️  管理界面: http://localhost:${PORT}/admin`);
  console.log(`🌐 外网访问: http://47.104.72.198:${PORT}`);
  console.log(`🛠️  外网管理: http://47.104.72.198:${PORT}/admin`);
  console.log('');
  console.log('💡 提示：如果需要停止服务器，按 Ctrl+C');
});
