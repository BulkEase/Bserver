const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { verifyToken, isOwner, isAdmin } = require('../middleware/auth');

router.get('/:userId', verifyToken, isOwner, cartController.getUserCart);
router.post('/', verifyToken, cartController.addToCart);
router.put('/:id', verifyToken, cartController.updateCartItem);
router.delete('/:id', verifyToken, cartController.removeFromCart);
router.put('/:id/status', verifyToken, isAdmin, cartController.updateStatus);

module.exports = router;