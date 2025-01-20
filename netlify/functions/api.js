const express = require('express');
const serverless = require('serverless-http');
const mongoose = require('mongoose');
const cors = require('cors');

const adminRoutes = require('../../src/routes/admin');
const shopRoutes = require('../../src/routes/shop');
const productRoutes = require('../../src/routes/products');
const orderRoutes = require('../../src/routes/orders');

const app = express();

// 中间件
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// 根路由
app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>账户商店 API</title>
      </head>
      <body>
        <h1>账户商店 API 文档</h1>
        <p>欢迎使用账户商店 API</p>
      </body>
    </html>
  `);
});

// API 状态路由
app.get('/api', (req, res) => {
  res.json({ message: '账户商店 API 正在运行' });
});

// API 路由
app.use('/api/admin', adminRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// MongoDB 连接
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected successfully');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    console.error('MongoDB URI:', process.env.MONGODB_URI);
  });

// 导出 handler
exports.handler = serverless(app);
