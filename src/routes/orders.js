const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const router = express.Router();

// 创建订单
router.post('/', async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({ message: '商品不存在' });
    }
    
    if (product.stock < quantity) {
      return res.status(400).json({ message: '库存不足' });
    }

    const order = new Order({
      ...req.body,
      total: product.price * quantity
    });

    // 减少库存
    product.stock -= quantity;
    await product.save();
    await order.save();

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取所有订单（管理员）
router.get('/', auth, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('productId')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新订单状态（管理员）
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
    if (!order) {
      return res.status(404).json({ message: '订单不存在' });
    }

    // 如果订单取消，恢复库存
    if (status === 'cancelled') {
      const product = await Product.findById(order.productId);
      if (product) {
        product.stock += order.quantity;
        await product.save();
      }
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 查询订单状态（用户）
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('productId');
    
    if (!order) {
      return res.status(404).json({ message: '订单不存在' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
