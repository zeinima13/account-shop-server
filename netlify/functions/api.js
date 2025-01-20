const express = require('express');
const serverless = require('serverless-http');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const Product = require('../../models/Product');
const Order = require('../../models/Order');
const { generateToken } = require('../../utils/auth');

const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// 设置 MongoDB 连接
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://zeinima13:zeinima13@cluster0.xtxwqn1.mongodb.net/account-shop?retryWrites=true&w=majority')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// API 路由
const router = express.Router();

// API 状态
router.get('/', (req, res) => {
  console.log('API is running');
  res.json({ message: '账户商店 API 正在运行' });
});

// 认证中间件
const authenticate = async (req, res, next) => {
  try {
    console.log('Auth headers:', req.headers);
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '未提供认证令牌' });
    }

    const token = authHeader.split(' ')[1];
    console.log('Token:', token);
    const decoded = jwt.verify(token, 'your-jwt-secret-key');
    console.log('Decoded token:', decoded);
    
    const user = await User.findById(decoded.id);
    console.log('Found user:', user);
    if (!user) {
      return res.status(401).json({ error: '用户不存在' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Authentication error:', err);
    res.status(401).json({ error: '无效的认证令牌' });
  }
};

// 管理员权限中间件
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: '需要管理员权限' });
  }
  next();
};

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
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: '请提供用户名和密码' });
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
    const { username, role } = req.body;
    
    if (!username || !role) {
      return res.status(400).json({ error: '缺少必要参数' });
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

// 创建产品（需要管理员权限）
router.post('/products', authenticate, requireAdmin, async (req, res) => {
  try {
    const { title, description, price, stock, type, status } = req.body;
    
    if (!title || !description || !price || !stock || !type || !status) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    const product = new Product({
      title,
      description,
      price,
      stock,
      type,
      status
    });

    await product.save();
    res.status(201).json(product);
  } catch (err) {
    console.error('Create product error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 获取产品列表
router.get('/products', async (req, res) => {
  try {
    const { type, status } = req.query;
    const filter = {};
    
    if (type) filter.type = type;
    if (status) filter.status = status;

    const products = await Product.find(filter);
    res.json(products);
  } catch (err) {
    console.error('Get products error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 获取单个产品
router.get('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: '产品不存在' });
    }
    res.json(product);
  } catch (err) {
    console.error('Get product error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 更新产品（需要管理员权限）
router.put('/products/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { title, description, price, stock, type, status } = req.body;
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ error: '产品不存在' });
    }

    if (title) product.title = title;
    if (description) product.description = description;
    if (price) product.price = price;
    if (stock) product.stock = stock;
    if (type) product.type = type;
    if (status) product.status = status;

    await product.save();
    res.json(product);
  } catch (err) {
    console.error('Update product error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 删除产品（需要管理员权限）
router.delete('/products/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ error: '产品不存在' });
    }
    res.json({ message: '产品已删除' });
  } catch (err) {
    console.error('Delete product error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 创建订单
router.post('/orders', authenticate, async (req, res) => {
  try {
    const user = req.user;
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
router.get('/orders', authenticate, async (req, res) => {
  try {
    const user = req.user;
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
