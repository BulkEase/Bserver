const express = require('express');
const router = express.Router();
const priceController = require('../controllers/priceController');
const { verifyToken, isAdmin } = require('../middleware/auth');

router.get('/product/:productId', priceController.getPriceByProduct);
router.get('/calculate/:productId', priceController.calculatePrice);
router.get('/', verifyToken, isAdmin, priceController.getAllPrices);
router.post('/', verifyToken, isAdmin, priceController.createPrice);
router.put('/:id', verifyToken, isAdmin, priceController.updatePrice);
router.delete('/:id', verifyToken, isAdmin, priceController.deletePrice);

module.exports = router;