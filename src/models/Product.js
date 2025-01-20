const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    default: '微博产品'
  },
  name: {
    type: String,
    required: true
  },
  seller: {
    type: String,
    required: true,
    default: '随机'
  },
  price: {
    type: Number,
    required: true
  },
  productId: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['available', 'sold', 'pending'],
    default: 'available'
  },
  description: {
    type: String,
    default: ''
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 确保 productId 唯一
productSchema.index({ productId: 1 }, { unique: true });

module.exports = mongoose.model('Product', productSchema);
