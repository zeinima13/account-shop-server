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

// 连接数据库
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('数据库连接成功'))
  .catch(err => console.error('数据库连接失败:', err));

// 中间件
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 路由
app.use('/api/admin', adminRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// 错误处理
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: '服务器错误' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});
