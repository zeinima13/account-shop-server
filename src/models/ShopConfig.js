const mongoose = require('mongoose');

const shopConfigSchema = new mongoose.Schema({
  banner: String,
  announcement: String,
  merchantInfo: {
    name: String,
    businessHours: String,
    qq: String,
    wechat: String
  }
}, { timestamps: true });

module.exports = mongoose.model('ShopConfig', shopConfigSchema);
