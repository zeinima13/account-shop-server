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
  res.json({ message: '账户商店 API 正在运行' });
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

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: '服务器内部错误' });
});

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
const handler = serverless(app);

exports.handler = async function(event, context) {
  try {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
      },
      body: JSON.stringify({
        message: '账户商店 API 正在运行'
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: '服务器内部错误' })
    };
  }
};
