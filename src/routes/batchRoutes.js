const express = require('express');
const router = express.Router();
const batchController = require('../controllers/batchController');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Public routes
router.get('/', batchController.getAllBatches);
router.get('/:id', batchController.getBatchById);

// Protected routes - Admin only
router.post('/', verifyToken, isAdmin, batchController.createBatch);
router.put('/:id', verifyToken, isAdmin, batchController.updateBatch);
router.delete('/:id', verifyToken, isAdmin, batchController.deleteBatch);
router.put('/:id/booking-count', verifyToken, isAdmin, batchController.updateBookingCount);

module.exports = router;