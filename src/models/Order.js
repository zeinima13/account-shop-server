const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: true
  },
  productInfo: {
    category: String,
    name: String,
    price: Number,
    seller: String
  },
  buyerInfo: {
    email: {
      type: String,
      required: true
    },
    region: {
      type: String,
      default: ''
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', ''],
      default: ''
    },
    notes: {
      type: String,
      default: ''
    }
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid', 'refunded'],
    default: 'unpaid'
  },
  paymentInfo: {
    method: String,
    transactionId: String,
    paidAt: Date
  },
  adminNotes: {
    type: String,
    default: ''
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 创建索引
orderSchema.index({ productId: 1 });
orderSchema.index({ 'buyerInfo.email': 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
