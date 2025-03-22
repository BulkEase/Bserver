const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['user', 'admin','customer'],
    default: 'user'
  },
  mobileNumber: {
    type: String,
    required: true,
    unique: true
  },
  address: {
    line1: {
      type: String,
      required: true
    },
    landmark: String,
    pincode: {
      type: String,
      required: true
    }
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  bookedCart: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CartItem'
  }],
  wishlist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  orderHistory: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'History'
  }],
  refreshToken: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema); 