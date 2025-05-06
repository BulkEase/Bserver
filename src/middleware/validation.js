const { validationResult, body } = require('express-validator');

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: errors.array().reduce((acc, err) => {
        acc[err.param] = err.msg;
        return acc;
      }, {})
    });
  }
  next();
};

// User validation rules
const userValidationRules = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('mobileNumber').notEmpty().withMessage('Mobile number is required'),
  body('address.line1').notEmpty().withMessage('Address line 1 is required'),
  body('address.pincode').notEmpty().withMessage('Pincode is required')
];

module.exports = {
  validate,
  userValidationRules
}; 