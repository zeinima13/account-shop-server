const express = require('express');
const Product = require('../models/Product');
const ProductType = require('../models/ProductType');
const auth = require('../middleware/auth');
const router = express.Router();

// 获取所有商品类型
router.get('/types', async (req, res) => {
  try {
    const types = await ProductType.find();
    res.json(types);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 创建商品类型
router.post('/types', auth, async (req, res) => {
  try {
    const type = new ProductType(req.body);
    await type.save();
    res.status(201).json(type);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取所有商品
router.get('/', async (req, res) => {
  try {
    const products = await Product.find().populate('typeId');
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取指定类型的商品
router.get('/type/:typeId', async (req, res) => {
  try {
    const products = await Product.find({ typeId: req.params.typeId });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 创建商品
router.post('/', auth, async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新商品
router.put('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!product) {
      return res.status(404).json({ message: '商品不存在' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除商品
router.delete('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: '商品不存在' });
    }
    res.json({ message: '商品删除成功' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
