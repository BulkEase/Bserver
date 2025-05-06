const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  console.log('Email configuration:', {
    service: process.env.EMAIL_SERVICE,
    user: process.env.EMAIL_USER ? process.env.EMAIL_USER.substring(0, 3) + '...' : 'Not configured', // Log partial email for security
    hasPassword: !!process.env.EMAIL_PASSWORD,
  });

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD || !process.env.EMAIL_SERVICE) {
    console.warn('⚠️ Email service not fully configured. Emails will not be sent.');
    return null;
  }

  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE, // e.g., 'gmail'
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

const transporter = createTransporter();

// Email templates
const emailTemplates = {
  verifyEmail: (token) => ({
    subject: 'Verify Your Email',
    html: `
      <h1>Welcome to Our Platform!</h1>
      <p>Please click the link below to verify your email address:</p>
      <a href="${process.env.BASE_URL || 'http://localhost:3000'}/api/users/verify-email/${token}">Verify Email</a>
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
      <a href="${process.env.BASE_URL || 'http://localhost:3000'}/reset-password/${token}">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `
  })
};

// Send email function
const sendEmail = async (to, template, data = {}) => {
  if (!transporter) {
    console.log(`📧 [Email] Would send "${template}" email to ${to} (Email service not configured)`);
    return false;
  }

  try {
    console.log(`📧 [Email] Sending "${template}" email to ${to}...`);
    
    const { subject, html } = emailTemplates[template](data);
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ [Email] Sent "${template}" email to ${to} successfully. Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`❌ [Email] Failed to send "${template}" email to ${to}:`, error);
    
    if (error.code === 'EAUTH') {
      console.error('Authentication error. Check your email credentials.');
    } else if (error.code === 'ESOCKET') {
      console.error('Network error. Check your internet connection and email service settings.');
    }
    
    // In development, we might want to continue without failing
    if (process.env.NODE_ENV === 'development') {
      console.log('Continuing without sending email in development mode');
      return false;
    }
    
    throw new Error('Failed to send email');
  }
};

module.exports = {
  sendEmail
}; 