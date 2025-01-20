const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const auth = require('../middleware/auth');

// 获取所有订单（管理员）
router.get('/', auth, async (req, res) => {
  try {
    const {
      status,
      paymentStatus,
      email,
      startDate,
      endDate,
      page = 1,
      limit = 10
    } = req.query;

    const query = {};
    
    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (email) query['buyerInfo.email'] = new RegExp(email, 'i');
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取单个订单
router.get('/:orderId', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ message: '订单未找到' });
    }
    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 创建订单
router.post('/', async (req, res) => {
  try {
    const { productId, buyerInfo } = req.body;

    // 查找并检查商品
    const product = await Product.findOne({ productId });
    if (!product) {
      return res.status(404).json({ message: '商品未找到' });
    }
    if (product.status !== 'available') {
      return res.status(400).json({ message: '商品已售出或不可用' });
    }

    // 创建订单
    const order = new Order({
      productId: product.productId,
      productInfo: {
        category: product.category,
        name: product.name,
        price: product.price,
        seller: product.seller
      },
      buyerInfo
    });

    // 保存订单
    await order.save();

    // 更新商品状态
    product.status = 'pending';
    await product.save();

    res.status(201).json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新订单状态（管理员）
router.patch('/:orderId/status', auth, async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const order = await Order.findById(req.params.orderId);
    
    if (!order) {
      return res.status(404).json({ message: '订单未找到' });
    }

    // 更新订单状态
    order.status = status;
    if (adminNotes) order.adminNotes = adminNotes;

    // 如果订单完成或取消，更新商品状态
    if (status === 'completed' || status === 'cancelled') {
      const product = await Product.findOne({ productId: order.productId });
      if (product) {
        product.status = status === 'completed' ? 'sold' : 'available';
        await product.save();
      }
    }

    await order.save();
    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新支付状态（管理员）
router.patch('/:orderId/payment', auth, async (req, res) => {
  try {
    const { paymentStatus, paymentInfo } = req.body;
    const order = await Order.findById(req.params.orderId);
    
    if (!order) {
      return res.status(404).json({ message: '订单未找到' });
    }

    order.paymentStatus = paymentStatus;
    if (paymentInfo) {
      order.paymentInfo = {
        ...order.paymentInfo,
        ...paymentInfo,
        paidAt: paymentStatus === 'paid' ? new Date() : order.paymentInfo?.paidAt
      };
    }

    await order.save();
    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 批量更新订单状态（管理员）
router.patch('/batch/status', auth, async (req, res) => {
  try {
    const { orderIds, status, adminNotes } = req.body;
    
    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ message: '请提供有效的订单ID列表' });
    }

    const updatePromises = orderIds.map(async (orderId) => {
      const order = await Order.findById(orderId);
      if (!order) return { orderId, success: false, message: '订单未找到' };

      order.status = status;
      if (adminNotes) order.adminNotes = adminNotes;

      // 如果订单完成或取消，更新商品状态
      if (status === 'completed' || status === 'cancelled') {
        const product = await Product.findOne({ productId: order.productId });
        if (product) {
          product.status = status === 'completed' ? 'sold' : 'available';
          await product.save();
        }
      }

      await order.save();
      return { orderId, success: true };
    });

    const results = await Promise.all(updatePromises);
    res.json({
      message: '批量更新完成',
      results
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
