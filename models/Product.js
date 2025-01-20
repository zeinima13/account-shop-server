const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  account: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['微博', 'QQ', '游戏', '其他']
  },
  status: {
    type: String,
    default: 'active',
    enum: ['active', 'sold']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Product', productSchema);
