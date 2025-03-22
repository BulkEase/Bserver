const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, isAdmin, isOwner } = require('../middleware/auth');

// Public routes
router.post('/', userController.createUser); // Signup

// Protected routes
router.get('/', verifyToken, isAdmin, userController.getAllUsers); // Admin only
router.get('/:id', verifyToken, isOwner, userController.getUserById); // Admin or own profile
router.put('/:id', verifyToken, isOwner, userController.updateUser); // Admin or own profile
router.delete('/:id', verifyToken, isAdmin, userController.deleteUser); // Admin only

module.exports = router; 