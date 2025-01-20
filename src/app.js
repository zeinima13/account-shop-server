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

// API文档路由
app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>账户商店 API 文档</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #333; }
        .endpoint { background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .method { color: #fff; padding: 5px 10px; border-radius: 3px; font-size: 12px; }
        .get { background-color: #61affe; }
        .post { background-color: #49cc90; }
        .delete { background-color: #f93e3e; }
      </style>
    </head>
    <body>
      <h1>账户商店 API 文档</h1>
      
      <div class="endpoint">
        <span class="method get">GET</span>
        <code>/api/products</code>
        <p>获取所有产品列表</p>
      </div>

      <div class="endpoint">
        <span class="method post">POST</span>
        <code>/api/products</code>
        <p>创建新产品</p>
      </div>

      <div class="endpoint">
        <span class="method get">GET</span>
        <code>/api/orders</code>
        <p>获取所有订单</p>
      </div>

      <div class="endpoint">
        <span class="method post">POST</span>
        <code>/api/orders</code>
        <p>创建新订单</p>
      </div>
    </body>
    </html>
  `);
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
