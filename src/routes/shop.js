const express = require('express');
const multer = require('multer');
const path = require('path');
const ShopConfig = require('../models/ShopConfig');
const auth = require('../middleware/auth');
const router = express.Router();

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// 获取商城配置
router.get('/config', async (req, res) => {
  try {
    let config = await ShopConfig.findOne();
    if (!config) {
      config = new ShopConfig({
        announcement: '欢迎来到账号商城！',
        merchantInfo: {
          name: '优质账号商城',
          businessHours: '7x24小时',
          qq: '123456789',
          wechat: 'shop123456'
        }
      });
      await config.save();
    }
    res.json(config);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新商城配置
router.put('/config', auth, async (req, res) => {
  try {
    const config = await ShopConfig.findOne();
    if (config) {
      Object.assign(config, req.body);
      await config.save();
    } else {
      await ShopConfig.create(req.body);
    }
    res.json({ message: '配置更新成功' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 上传横幅图片
router.post('/banner', auth, upload.single('banner'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '请上传图片' });
    }

    const config = await ShopConfig.findOne();
    if (config) {
      config.banner = `/uploads/${req.file.filename}`;
      await config.save();
    } else {
      await ShopConfig.create({ banner: `/uploads/${req.file.filename}` });
    }

    res.json({ message: '横幅上传成功' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
