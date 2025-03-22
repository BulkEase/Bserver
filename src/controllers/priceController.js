const Price = require('../models/Price');
const Product = require('../models/Product');
const Batch = require('../models/Batch');

// Get all price configurations
exports.getAllPrices = async (req, res) => {
  try {
    const prices = await Price.find().populate('product');
    res.json(prices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get price configuration by product ID
exports.getPriceByProduct = async (req, res) => {
  try {
    const price = await Price.findOne({ 
      product: req.params.productId,
      isActive: true 
    }).populate('product');
    
    if (!price) {
      return res.status(404).json({ message: 'Price configuration not found' });
    }
    res.json(price);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new price configuration
exports.createPrice = async (req, res) => {
  try {
    // Check if product exists
    const product = await Product.findById(req.body.product);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Deactivate existing price configurations for this product
    await Price.updateMany(
      { product: req.body.product },
      { isActive: false }
    );

    // Create new price configuration
    const price = new Price(req.body);
    const newPrice = await price.save();
    res.status(201).json(newPrice);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update price configuration
exports.updatePrice = async (req, res) => {
  try {
    const price = await Price.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!price) {
      return res.status(404).json({ message: 'Price configuration not found' });
    }
    res.json(price);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete price configuration
exports.deletePrice = async (req, res) => {
  try {
    const price = await Price.findByIdAndDelete(req.params.id);
    if (!price) {
      return res.status(404).json({ message: 'Price configuration not found' });
    }
    res.json({ message: 'Price configuration deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Calculate current price based on booking count
exports.calculatePrice = async (req, res) => {
  try {
    const { productId } = req.params;
    
    // Get current batch booking count
    const batch = await Batch.findOne({ 
      product: productId,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    });

    if (!batch) {
      return res.status(404).json({ message: 'No active batch found' });
    }

    // Get active price configuration
    const priceConfig = await Price.findOne({ 
      product: productId,
      isActive: true 
    });

    if (!priceConfig) {
      return res.status(404).json({ message: 'No active price configuration found' });
    }

    // Find applicable price range
    const applicableRange = priceConfig.priceRanges.find(
      range => batch.bookingCount >= range.minBooking && batch.bookingCount <= range.maxBooking
    );

    if (!applicableRange) {
      return res.status(404).json({ message: 'No applicable price range found for current booking count' });
    }

    res.json({
      currentPrice: applicableRange.price,
      bookingCount: batch.bookingCount,
      priceRange: {
        min: applicableRange.minBooking,
        max: applicableRange.maxBooking
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 