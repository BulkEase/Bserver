const express = require('express');
const router = express.Router();

// Import route modules
const userRoutes = require('./userRoutes');
const productRoutes = require('./productRoutes');
const cartRoutes = require('./cartRoutes');
const batchRoutes = require('./batchRoutes');
const priceRoutes = require('./priceRoutes');

// Mount routes
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/cart', cartRoutes);
router.use('/batches', batchRoutes);
router.use('/prices', priceRoutes);

module.exports = router; 