const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  bookingCount: {
    type: Number,
    default: 0
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  }
});

module.exports = mongoose.model('Batch', batchSchema); 