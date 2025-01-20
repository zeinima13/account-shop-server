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
    const { category, status, page = 1, limit = 10 } = req.query;
    const query = {};
    
    if (category) query.category = category;
    if (status) query.status = status;

    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(query);

    res.json({
      products,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error(error);
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

// 获取单个商品
router.get('/:productId', async (req, res) => {
  try {
    const product = await Product.findOne({ productId: req.params.productId });
    if (!product) {
      return res.status(404).json({ message: '商品未找到' });
    }
    res.json(product);
  } catch (error) {
    console.error(error);
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
    if (error.code === 11000) {
      return res.status(400).json({ message: '商品ID已存在' });
    }
    console.error(error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 批量导入商品
router.post('/batch', auth, async (req, res) => {
  try {
    const products = req.body;
    if (!Array.isArray(products)) {
      return res.status(400).json({ message: '请提供商品数组' });
    }

    // 转换数据格式
    const formattedProducts = products.map(product => ({
      category: product.商品分类,
      name: product.商品名称,
      seller: product.选择目标,
      price: parseFloat(product.商品单价),
      productId: product.商品库存号,
      status: 'available',
      description: ''
    }));

    // 使用 insertMany 批量插入，设置 ordered: false 允许部分成功
    const result = await Product.insertMany(formattedProducts, { ordered: false });
    res.status(201).json({
      message: '批量导入成功',
      insertedCount: result.length
    });
  } catch (error) {
    if (error.writeErrors) {
      // 部分插入成功的情况
      const successCount = error.insertedDocs.length;
      const failCount = error.writeErrors.length;
      res.status(207).json({
        message: '部分导入成功',
        successCount,
        failCount,
        errors: error.writeErrors.map(e => ({
          productId: e.err.op.productId,
          reason: e.err.code === 11000 ? '商品ID重复' : '数据格式错误'
        }))
      });
    } else {
      console.error(error);
      res.status(500).json({ message: '服务器错误' });
    }
  }
});

// 更新商品
router.put('/:productId', auth, async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { productId: req.params.productId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!product) {
      return res.status(404).json({ message: '商品未找到' });
    }
    res.json(product);
  } catch (error) {
    console.error(error);
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
    console.error(error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除商品（根据productId）
router.delete('/:productId', auth, async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({ productId: req.params.productId });
    if (!product) {
      return res.status(404).json({ message: '商品未找到' });
    }
    res.json({ message: '商品删除成功' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
