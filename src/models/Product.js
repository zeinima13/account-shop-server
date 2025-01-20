const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  typeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductType',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  stock: {
    type: Number,
    required: true,
    default: 0
  },
  description: String
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
