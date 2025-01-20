require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');

const app = express();

console.log('Starting server...');
console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');

// 中间件
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 连接数据库
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4
})
  .then(() => console.log('数据库连接成功'))
  .catch(err => {
    console.error('数据库连接失败:', err);
    console.error('MongoDB URI:', process.env.MONGODB_URI);
  });

// 根路由
app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  const html = `
    <!DOCTYPE html>
    <html lang="zh-CN">
      <head>
        <title>账户商店 API</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { 
            font-family: system-ui, -apple-system, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            line-height: 1.6;
            background: #f9f9f9;
          }
          h1 { 
            color: #333;
            border-bottom: 2px solid #eee;
            padding-bottom: 0.5rem;
          }
          .endpoint {
            background: #fff;
            padding: 1.5rem;
            border-radius: 8px;
            margin: 1rem 0;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .endpoint h3 {
            margin: 0 0 1rem 0;
            color: #2563eb;
          }
          .method {
            background: #2563eb;
            color: white;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.875rem;
            margin-right: 0.5rem;
          }
          .path {
            color: #333;
            font-family: monospace;
          }
        </style>
      </head>
      <body>
        <h1>账户商店 API 文档</h1>
        <p>API 版本：v1.0</p>
        <div class="endpoint">
          <h3><span class="method">GET</span><span class="path">/api</span></h3>
          <p>检查 API 状态和环境变量配置</p>
        </div>
        <div class="endpoint">
          <h3><span class="method">GET</span><span class="path">/api/products</span></h3>
          <p>获取商品列表</p>
        </div>
        <div class="endpoint">
          <h3><span class="method">POST</span><span class="path">/api/admin/register</span></h3>
          <p>管理员注册（需要用户名和密码）</p>
        </div>
      </body>
    </html>
  `;
  res.send(html);
});

app.get('/api', (req, res) => {
  res.json({ 
    message: '账户商店 API v1.0 正在运行',
    env: {
      mongodbUri: process.env.MONGODB_URI ? 'Set' : 'Not set',
      nodeEnv: process.env.NODE_ENV
    }
  });
});

// API 路由
app.use('/api/admin', adminRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    message: '服务器错误',
    error: err.message 
  });
});

// 404 处理
app.use((req, res) => {
  console.log('404 Not Found:', req.method, req.url);
  res.status(404).json({ message: '未找到所请求的资源' });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});

module.exports = app;
