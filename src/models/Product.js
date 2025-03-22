const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    auto: true,
    primary: true
  },
  productName: {
    type: String,
    required: true,
    trim: true
  },
  productDescription: {
    type: String,
    required: true
  },
  productImage: {
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String,
      required: true
    }
  },
  batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch'
  },
  priceCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Price'
  }],
  currentPrice: {
    type: Number,
    required: true
  },
  content: {
    type: String
  },
  stars: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  }
}, {
  timestamps: true
});

// Middleware to delete image from Cloudinary when product is deleted
productSchema.pre('remove', async function(next) {
  try {
    if (this.productImage.publicId) {
      const cloudinary = require('../utils/cloudinary');
      await cloudinary.deleteFile(this.productImage.publicId);
    }
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('Product', productSchema); 