const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE, // e.g., 'gmail'
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Email templates
const emailTemplates = {
  verifyEmail: (token) => ({
    subject: 'Verify Your Email',
    html: `
      <h1>Welcome to Our Platform!</h1>
      <p>Please click the link below to verify your email address:</p>
      <a href="${process.env.BASE_URL}/api/users/verify/${token}">Verify Email</a>
      <p>This link will expire in 24 hours.</p>
    `
  }),
  
  orderConfirmation: (order) => ({
    subject: 'Order Confirmation',
    html: `
      <h1>Thank You for Your Order!</h1>
      <p>Your order has been confirmed.</p>
      <h2>Order Details:</h2>
      <p>Order ID: ${order._id}</p>
      <p>Total Amount: $${order.amountPaid}</p>
      <p>Expected Delivery: ${new Date(order.expDeliveryDate).toLocaleDateString()}</p>
    `
  }),

  orderStatusUpdate: (order) => ({
    subject: 'Order Status Update',
    html: `
      <h1>Order Status Update</h1>
      <p>Your order status has been updated to: ${order.status}</p>
      <h2>Order Details:</h2>
      <p>Order ID: ${order._id}</p>
      <p>Updated Status: ${order.status}</p>
      ${order.status === 'Delivered' ? '<p>Your order has been delivered!</p>' : ''}
    `
  }),

  passwordReset: (token) => ({
    subject: 'Password Reset Request',
    html: `
      <h1>Password Reset Request</h1>
      <p>Click the link below to reset your password:</p>
      <a href="${process.env.BASE_URL}/reset-password/${token}">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `
  })
};

// Send email function
const sendEmail = async (to, template, data = {}) => {
  try {
    const { subject, html } = emailTemplates[template](data);
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    throw new Error('Failed to send email');
  }
};

module.exports = {
  sendEmail
}; 