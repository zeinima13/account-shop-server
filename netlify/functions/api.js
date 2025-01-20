const express = require('express');
const serverless = require('serverless-http');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// 中间件
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// MongoDB 连接
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: '服务器内部错误' });
});

// 导出 handler
const handler = serverless(app);

exports.handler = async function(event, context) {
  // 设置 CORS 头
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
    'Content-Type': 'application/json'
  };

  try {
    const path = event.path.replace('/.netlify/functions/api', '');
    const method = event.httpMethod;

    // 路由处理
    if (method === 'GET' && (path === '' || path === '/')) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: '账户商店 API 正在运行' })
      };
    }

    if (method === 'POST' && path === '/auth/login') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: '登录功能即将上线' })
      };
    }

    if (method === 'GET' && path === '/products') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: '商品列表功能即将上线' })
      };
    }

    if (method === 'POST' && path === '/orders') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: '订单创建功能即将上线' })
      };
    }

    // 404 处理
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: '找不到请求的资源' })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: '服务器内部错误' })
    };
  }
};
