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

// 路由处理
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: '账户商店 API 正在运行' });
});

router.post('/auth/login', (req, res) => {
  res.json({ message: '登录功能即将上线' });
});

router.get('/products', (req, res) => {
  res.json({ message: '商品列表功能即将上线' });
});

router.post('/orders', (req, res) => {
  res.json({ message: '订单创建功能即将上线' });
});

app.use('/', router);

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: '服务器内部错误' });
});

// 导出 handler
const handler = serverless(app);

module.exports.handler = async (event, context) => {
  // 打印请求信息用于调试
  console.log('Request event:', event);
  
  try {
    const result = await handler(event, context);
    return result;
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: '服务器内部错误' })
    };
  }
};
