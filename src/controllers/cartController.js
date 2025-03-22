const CartItem = require('../models/CartItem');
const User = require('../models/User');
const History = require('../models/History');
const { sendEmail } = require('../utils/emailService');

// Get cart items for a user
exports.getUserCart = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId).populate({
      path: 'bookedCart',
      populate: { path: 'product' }
    });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user.bookedCart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add item to cart
exports.addToCart = async (req, res) => {
  try {
    const cartItem = new CartItem(req.body);
    const savedItem = await cartItem.save();
    
    // Add to user's bookedCart
    const user = await User.findByIdAndUpdate(
      req.body.user,
      { $push: { bookedCart: savedItem._id } },
      { new: true }
    );

    // Send order confirmation email
    await sendEmail(user.email, 'orderConfirmation', savedItem);
    
    res.status(201).json(savedItem);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update cart item
exports.updateCartItem = async (req, res) => {
  try {
    const cartItem = await CartItem.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!cartItem) {
      return res.status(404).json({ message: 'Cart item not found' });
    }
    res.json(cartItem);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Remove from cart
exports.removeFromCart = async (req, res) => {
  try {
    const cartItem = await CartItem.findById(req.params.id);
    if (!cartItem) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    // Remove from user's bookedCart
    await User.findByIdAndUpdate(
      cartItem.user,
      { $pull: { bookedCart: cartItem._id } }
    );

    // If status is Delivered, move to history
    if (cartItem.status === 'Delivered') {
      const history = await History.findOneAndUpdate(
        { user: cartItem.user },
        { $push: { deliveredItems: cartItem._id } },
        { upsert: true, new: true }
      );

      await User.findByIdAndUpdate(
        cartItem.user,
        { $push: { orderHistory: history._id } }
      );
    }

    await CartItem.findByIdAndDelete(req.params.id);
    res.json({ message: 'Item removed from cart successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update cart item status
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const cartItem = await CartItem.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate('user');

    if (!cartItem) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    // Send status update email
    await sendEmail(cartItem.user.email, 'orderStatusUpdate', cartItem);

    res.json(cartItem);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}; 