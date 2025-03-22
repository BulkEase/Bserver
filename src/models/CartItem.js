const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  amountPaid: {
    type: Number,
    required: true
  },
  amountRemaining: {
    type: Number,
    required: true
  },
  expDeliveryDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Delivered'],
    default: 'Pending'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    type: Number,
    required: true
  }]
});

module.exports = mongoose.model('CartItem', cartItemSchema); 