const express = require('express');
const serverless = require('serverless-http');
const mongoose = require('mongoose');
const cors = require('cors');
const User = require('../../models/User');
const Product = require('../../models/Product');
const Order = require('../../models/Order');
const { generateToken, authenticate } = require('../../utils/auth');

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

// 通用响应头
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
  'Content-Type': 'application/json'
};

// 处理成功响应
const success = (data) => ({
  statusCode: 200,
  headers,
  body: JSON.stringify(data)
});

// 处理错误响应
const error = (message, statusCode = 500) => ({
  statusCode,
  headers,
  body: JSON.stringify({ error: message })
});

// 导出 handler
const handler = serverless(app);

exports.handler = async function(event, context) {
  // 处理 OPTIONS 请求
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }

  try {
    const path = event.path.replace('/.netlify/functions/api', '');
    const method = event.httpMethod;
    const body = event.body ? JSON.parse(event.body) : {};

    // API 状态检查
    if (method === 'GET' && (path === '' || path === '/')) {
      return success({ message: '账户商店 API 正在运行' });
    }

    // 用户登录
    if (method === 'POST' && path === '/auth/login') {
      const { username, password } = body;
      
      if (!username || !password) {
        return error('请提供用户名和密码', 400);
      }

      const user = await User.findOne({ username });
      if (!user || !(await user.comparePassword(password))) {
        return error('用户名或密码错误', 401);
      }

      const token = generateToken(user);
      return success({ token, user: { id: user._id, username: user.username, role: user.role } });
    }

    // 用户注册
    if (method === 'POST' && path === '/auth/register') {
      const { username, password } = body;
      
      if (!username || !password) {
        return error('请提供用户名和密码', 400);
      }

      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return error('用户名已存在', 400);
      }

      const user = new User({ username, password });
      await user.save();

      const token = generateToken(user);
      return success({ token, user: { id: user._id, username: user.username, role: user.role } });
    }

    // 获取商品列表
    if (method === 'GET' && path === '/products') {
      const products = await Product.find({ status: 'available' })
        .select('-__v')
        .sort('-createdAt');
      return success({ products });
    }

    // 创建商品（需要管理员权限）
    if (method === 'POST' && path === '/products') {
      try {
        const user = await authenticate(event);
        if (user.role !== 'admin') {
          return error('没有权限执行此操作', 403);
        }

        const product = new Product(body);
        await product.save();
        return success({ product });
      } catch (err) {
        return error(err.message, 401);
      }
    }

    // 创建订单
    if (method === 'POST' && path === '/orders') {
      try {
        const user = await authenticate(event);
        const { productId } = body;

        if (!productId) {
          return error('请提供商品ID', 400);
        }

        const product = await Product.findById(productId);
        if (!product || product.status !== 'available') {
          return error('商品不可用', 400);
        }

        // 创建订单
        const order = new Order({
          user: user.id,
          product: productId,
          price: product.price
        });

        // 更新商品状态
        product.status = 'reserved';
        
        await Promise.all([
          order.save(),
          product.save()
        ]);

        return success({ order });
      } catch (err) {
        return error(err.message, 401);
      }
    }

    // 获取用户订单
    if (method === 'GET' && path === '/orders') {
      try {
        const user = await authenticate(event);
        const orders = await Order.find({ user: user.id })
          .populate('product')
          .sort('-createdAt');
        return success({ orders });
      } catch (err) {
        return error(err.message, 401);
      }
    }

    // 404 处理
    return error('找不到请求的资源', 404);

  } catch (err) {
    console.error('Error:', err);
    return error('服务器内部错误');
  }
};
