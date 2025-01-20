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
app.use(cors());
app.use(express.json());

// 设置 MongoDB 连接
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// API 路由
const router = express.Router();

// API 状态
router.get('/', (req, res) => {
  res.json({ message: '账户商店 API 正在运行' });
});

// 用户注册
router.post('/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: '请提供用户名和密码' });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: '用户名已存在' });
    }

    const user = new User({ username, password });
    await user.save();

    const token = generateToken(user);
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 用户登录
router.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: '请提供用户名和密码' });
    }

    const user = await User.findOne({ username });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const token = generateToken(user);
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 创建管理员账户
router.post('/auth/create-admin', async (req, res) => {
  try {
    const { username, password, secretKey } = req.body;
    
    console.log('Creating admin account:', { username, secretKey });
    console.log('Environment:', { 
      ADMIN_SECRET_KEY: process.env.ADMIN_SECRET_KEY,
      NODE_ENV: process.env.NODE_ENV
    });
    
    if (!username || !password || !secretKey) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    if (secretKey !== process.env.ADMIN_SECRET_KEY) {
      return res.status(401).json({ error: `无效的密钥: ${secretKey} !== ${process.env.ADMIN_SECRET_KEY}` });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: '用户名已存在' });
    }

    const user = new User({
      username,
      password,
      role: 'admin'
    });

    await user.save();

    const token = generateToken(user);
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Create admin error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 更新用户角色
router.put('/auth/update-role', async (req, res) => {
  try {
    const { username, role, secretKey } = req.body;
    
    console.log('Updating user role:', { username, role, secretKey });
    
    if (!username || !role || !secretKey) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    if (secretKey !== process.env.ADMIN_SECRET_KEY) {
      return res.status(401).json({ error: '无效的密钥' });
    }

    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({ error: '无效的角色' });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    user.role = role;
    await user.save();

    res.json({
      message: '用户角色已更新',
      user: {
        id: user._id,
        username: user.username,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Update role error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 获取商品列表
router.get('/products', async (req, res) => {
  try {
    const products = await Product.find({ status: 'available' })
      .select('-__v')
      .sort('-createdAt');
    res.json({ products });
  } catch (err) {
    console.error('Get products error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 创建商品（需要管理员权限）
router.post('/products', async (req, res) => {
  try {
    const user = await authenticate(req);
    if (user.role !== 'admin') {
      return res.status(403).json({ error: '没有权限执行此操作' });
    }

    const product = new Product(req.body);
    await product.save();
    res.json({ product });
  } catch (err) {
    console.error('Create product error:', err);
    res.status(401).json({ error: err.message });
  }
});

// 创建订单
router.post('/orders', async (req, res) => {
  try {
    const user = await authenticate(req);
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ error: '请提供商品ID' });
    }

    const product = await Product.findById(productId);
    if (!product || product.status !== 'available') {
      return res.status(400).json({ error: '商品不可用' });
    }

    const order = new Order({
      user: user.id,
      product: productId,
      price: product.price
    });

    product.status = 'reserved';
    
    await Promise.all([
      order.save(),
      product.save()
    ]);

    res.json({ order });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(401).json({ error: err.message });
  }
});

// 获取用户订单
router.get('/orders', async (req, res) => {
  try {
    const user = await authenticate(req);
    const orders = await Order.find({ user: user.id })
      .populate('product')
      .sort('-createdAt');
    res.json({ orders });
  } catch (err) {
    console.error('Get orders error:', err);
    res.status(401).json({ error: err.message });
  }
});

// 使用路由
app.use('/.netlify/functions/api', router);

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: '服务器内部错误' });
});

// 导出 handler
module.exports.handler = serverless(app);
