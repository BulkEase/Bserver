module.exports = {
  // Test database configuration
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/test-db',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  },

  // JWT configuration for testing
  jwt: {
    secret: 'test-jwt-secret',
    refreshSecret: 'test-refresh-secret',
    expiresIn: '1h',
    refreshExpiresIn: '7d'
  },

  // Rate limiting configuration for testing
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  },

  // Email configuration for testing
  email: {
    host: 'smtp.test.com',
    port: 587,
    secure: false,
    auth: {
      user: 'test@example.com',
      pass: 'test-password'
    }
  },

  // Test user credentials
  testUser: {
    name: 'Test User',
    email: 'test@example.com',
    password: 'TestPassword123!',
    role: 'user'
  },

  // Test admin credentials
  testAdmin: {
    name: 'Test Admin',
    email: 'admin@example.com',
    password: 'AdminPassword123!',
    role: 'admin'
  },

  // Test timeouts
  timeouts: {
    short: 1000,
    medium: 5000,
    long: 10000
  }
}; 