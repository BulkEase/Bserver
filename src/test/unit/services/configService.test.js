const { expect } = require('chai');
const { config, loadConfig, validateConfig } = require('./configService');

describe('Config Service', () => {
  describe('Config Loading', () => {
    it('should load configuration from environment variables', () => {
      process.env.PORT = '3000';
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
      process.env.JWT_SECRET = 'test-secret';
      process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret';
      process.env.NODE_ENV = 'test';

      loadConfig();
      expect(config.port).to.equal(3000);
      expect(config.mongodbUri).to.equal('mongodb://localhost:27017/test');
      expect(config.jwtSecret).to.equal('test-secret');
      expect(config.refreshTokenSecret).to.equal('test-refresh-secret');
      expect(config.nodeEnv).to.equal('test');
    });

    it('should use default values when environment variables are not set', () => {
      delete process.env.PORT;
      delete process.env.MONGODB_URI;
      delete process.env.JWT_SECRET;
      delete process.env.REFRESH_TOKEN_SECRET;
      delete process.env.NODE_ENV;

      loadConfig();
      expect(config.port).to.equal(3000);
      expect(config.mongodbUri).to.equal('mongodb://localhost:27017/development');
      expect(config.jwtSecret).to.equal('your-secret-key');
      expect(config.refreshTokenSecret).to.equal('your-refresh-secret-key');
      expect(config.nodeEnv).to.equal('development');
    });

    it('should handle invalid port number', () => {
      process.env.PORT = 'invalid';
      expect(() => loadConfig()).to.throw('Invalid port number');
    });
  });

  describe('Config Validation', () => {
    it('should validate required configuration', () => {
      const validConfig = {
        port: 3000,
        mongodbUri: 'mongodb://localhost:27017/test',
        jwtSecret: 'test-secret',
        refreshTokenSecret: 'test-refresh-secret',
        nodeEnv: 'test'
      };

      expect(() => validateConfig(validConfig)).to.not.throw();
    });

    it('should throw error for missing required fields', () => {
      const invalidConfig = {
        port: 3000,
        mongodbUri: 'mongodb://localhost:27017/test'
      };

      expect(() => validateConfig(invalidConfig)).to.throw('Missing required configuration');
    });

    it('should validate port number range', () => {
      const invalidConfig = {
        port: 0,
        mongodbUri: 'mongodb://localhost:27017/test',
        jwtSecret: 'test-secret',
        refreshTokenSecret: 'test-refresh-secret',
        nodeEnv: 'test'
      };

      expect(() => validateConfig(invalidConfig)).to.throw('Port must be between 1 and 65535');
    });

    it('should validate MongoDB URI format', () => {
      const invalidConfig = {
        port: 3000,
        mongodbUri: 'invalid-uri',
        jwtSecret: 'test-secret',
        refreshTokenSecret: 'test-refresh-secret',
        nodeEnv: 'test'
      };

      expect(() => validateConfig(invalidConfig)).to.throw('Invalid MongoDB URI');
    });

    it('should validate JWT secrets', () => {
      const invalidConfig = {
        port: 3000,
        mongodbUri: 'mongodb://localhost:27017/test',
        jwtSecret: '',
        refreshTokenSecret: 'test-refresh-secret',
        nodeEnv: 'test'
      };

      expect(() => validateConfig(invalidConfig)).to.throw('JWT secret cannot be empty');
    });
  });

  describe('Environment-specific Configuration', () => {
    it('should load development configuration', () => {
      process.env.NODE_ENV = 'development';
      loadConfig();
      expect(config.nodeEnv).to.equal('development');
      expect(config.mongodbUri).to.include('development');
    });

    it('should load test configuration', () => {
      process.env.NODE_ENV = 'test';
      loadConfig();
      expect(config.nodeEnv).to.equal('test');
      expect(config.mongodbUri).to.include('test');
    });

    it('should load production configuration', () => {
      process.env.NODE_ENV = 'production';
      loadConfig();
      expect(config.nodeEnv).to.equal('production');
      expect(config.mongodbUri).to.include('production');
    });
  });

  describe('Security Configuration', () => {
    it('should validate JWT expiration times', () => {
      const invalidConfig = {
        port: 3000,
        mongodbUri: 'mongodb://localhost:27017/test',
        jwtSecret: 'test-secret',
        refreshTokenSecret: 'test-refresh-secret',
        nodeEnv: 'test',
        jwtExpiresIn: 'invalid'
      };

      expect(() => validateConfig(invalidConfig)).to.throw('Invalid JWT expiration time');
    });

    it('should validate refresh token expiration time', () => {
      const invalidConfig = {
        port: 3000,
        mongodbUri: 'mongodb://localhost:27017/test',
        jwtSecret: 'test-secret',
        refreshTokenSecret: 'test-refresh-secret',
        nodeEnv: 'test',
        refreshTokenExpiresIn: 'invalid'
      };

      expect(() => validateConfig(invalidConfig)).to.throw('Invalid refresh token expiration time');
    });
  });

  describe('Rate Limiting Configuration', () => {
    it('should validate rate limit window', () => {
      const invalidConfig = {
        port: 3000,
        mongodbUri: 'mongodb://localhost:27017/test',
        jwtSecret: 'test-secret',
        refreshTokenSecret: 'test-refresh-secret',
        nodeEnv: 'test',
        rateLimitWindow: 'invalid'
      };

      expect(() => validateConfig(invalidConfig)).to.throw('Invalid rate limit window');
    });

    it('should validate rate limit max requests', () => {
      const invalidConfig = {
        port: 3000,
        mongodbUri: 'mongodb://localhost:27017/test',
        jwtSecret: 'test-secret',
        refreshTokenSecret: 'test-refresh-secret',
        nodeEnv: 'test',
        rateLimitMax: 'invalid'
      };

      expect(() => validateConfig(invalidConfig)).to.throw('Invalid rate limit max requests');
    });
  });

  describe('Email Configuration', () => {
    it('should validate email configuration', () => {
      const invalidConfig = {
        port: 3000,
        mongodbUri: 'mongodb://localhost:27017/test',
        jwtSecret: 'test-secret',
        refreshTokenSecret: 'test-refresh-secret',
        nodeEnv: 'test',
        smtpHost: 'smtp.example.com',
        smtpPort: 'invalid'
      };

      expect(() => validateConfig(invalidConfig)).to.throw('Invalid SMTP port');
    });

    it('should validate email credentials', () => {
      const invalidConfig = {
        port: 3000,
        mongodbUri: 'mongodb://localhost:27017/test',
        jwtSecret: 'test-secret',
        refreshTokenSecret: 'test-refresh-secret',
        nodeEnv: 'test',
        smtpUser: '',
        smtpPass: 'password'
      };

      expect(() => validateConfig(invalidConfig)).to.throw('SMTP credentials are required');
    });
  });
}); 