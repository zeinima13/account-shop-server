const mongoose = require('mongoose');

const productTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String
}, { timestamps: true });

module.exports = mongoose.model('ProductType', productTypeSchema);
