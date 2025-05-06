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
    console.log(`🛒 New cart item added: ${savedItem._id} for user ${req.body.user}`);
    
    // Add to user's bookedCart
    const user = await User.findByIdAndUpdate(
      req.body.user,
      { $push: { bookedCart: savedItem._id } },
      { new: true }
    );

    // Send order confirmation email
    try {
      const emailSent = await sendEmail(user.email, 'orderConfirmation', savedItem);
      if (emailSent) {
        console.log(`📧 Order confirmation email sent to ${user.email} for order ${savedItem._id}`);
      } else {
        console.warn(`⚠️ Order confirmation email not sent to ${user.email} - email service might not be configured`);
      }
    } catch (emailError) {
      console.error(`❌ Error sending order confirmation email to ${user.email}:`, emailError);
    }
    
    res.status(201).json(savedItem);
  } catch (error) {
    console.error('❌ Error adding item to cart:', error);
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
    console.log(`🔄 Updating cart item ${req.params.id} status to: ${status}`);
    
    const cartItem = await CartItem.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate('user');

    if (!cartItem) {
      console.log(`❌ Cart item ${req.params.id} not found for status update`);
      return res.status(404).json({ message: 'Cart item not found' });
    }

    // Send status update email
    try {
      const emailSent = await sendEmail(cartItem.user.email, 'orderStatusUpdate', cartItem);
      if (emailSent) {
        console.log(`📧 Order status update email sent to ${cartItem.user.email} for order ${cartItem._id}`);
      } else {
        console.warn(`⚠️ Order status update email not sent to ${cartItem.user.email} - email service might not be configured`);
      }
    } catch (emailError) {
      console.error(`❌ Error sending order status update email to ${cartItem.user.email}:`, emailError);
    }

    res.json(cartItem);
  } catch (error) {
    console.error('❌ Error updating cart item status:', error);
    res.status(400).json({ message: error.message });
  }
}; 