const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, isAdmin, isOwner } = require('../middleware/auth');
const { validate, userValidationRules } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');

// Public routes
router.post('/register', userValidationRules, validate, userController.createUser);
router.post('/login', userController.loginUser);
router.post('/refresh-token', userController.refreshToken);
router.get('/verify-email/:token', userController.verifyEmail);
router.post('/forgot-password', userController.forgotPassword);
router.post('/reset-password/:token', userController.resetPassword);

// Protected routes
router.use(authenticate);
router.post('/logout', userController.logoutUser);
router.get('/profile', userController.getUserProfile);
router.put('/profile', userValidationRules, validate, userController.updateUserProfile);
router.delete('/profile', userController.deleteUserProfile);

router.get('/', verifyToken, isAdmin, userController.getAllUsers); // Admin only
router.get('/:id', verifyToken, isOwner, userController.getUserById); // Admin or own profile
router.put('/:id', verifyToken, isOwner, userController.updateUser); // Admin or own profile
router.delete('/:id', verifyToken, isAdmin, userController.deleteUser); // Admin only

module.exports = router; 