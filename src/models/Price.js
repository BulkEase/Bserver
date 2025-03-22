const mongoose = require('mongoose');

const priceSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  priceRanges: [{
    minBooking: {
      type: Number,
      required: true
    },
    maxBooking: {
      type: Number,
      required: true
    },
    price: {
      type: Number,
      required: true
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware to ensure price ranges don't overlap
priceSchema.pre('save', function(next) {
  const ranges = this.priceRanges.sort((a, b) => a.minBooking - b.minBooking);
  
  for (let i = 0; i < ranges.length - 1; i++) {
    if (ranges[i].maxBooking >= ranges[i + 1].minBooking) {
      next(new Error('Price ranges cannot overlap'));
      return;
    }
  }
  next();
});

module.exports = mongoose.model('Price', priceSchema); 