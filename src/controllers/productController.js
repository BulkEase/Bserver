const Product = require('../models/Product');
const cloudinary = require('../utils/cloudinary');

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .populate('batch')
      .populate('priceCategories');
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get product by ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('batch')
      .populate('priceCategories');
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new product with image
exports.createProduct = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Image is required' });
    }

    // Upload image buffer to Cloudinary
    const result = await cloudinary.uploadBuffer(req.file.buffer);
    
    // Create product with Cloudinary image details
    const product = new Product({
      ...req.body,
      productImage: {
        url: result.secure_url,
        publicId: result.public_id
      }
    });

    const newProduct = await product.save();
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update product
exports.updateProduct = async (req, res) => {
  try {
    let updateData = { ...req.body };

    // If new image is uploaded
    if (req.file) {
      // Get existing product
      const existingProduct = await Product.findById(req.params.id);
      if (existingProduct && existingProduct.productImage.publicId) {
        // Delete old image from Cloudinary
        await cloudinary.deleteFile(existingProduct.productImage.publicId);
      }

      // Upload new image buffer
      const result = await cloudinary.uploadBuffer(req.file.buffer);
      updateData.productImage = {
        url: result.secure_url,
        publicId: result.public_id
      };
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Delete image from Cloudinary
    if (product.productImage.publicId) {
      await cloudinary.deleteFile(product.productImage.publicId);
    }

    await product.remove();
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update product rating
exports.updateRating = async (req, res) => {
  try {
    const { stars } = req.body;
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { stars },
      { new: true, runValidators: true }
    );
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}; 