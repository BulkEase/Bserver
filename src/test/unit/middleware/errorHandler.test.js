const { expect } = require('chai');
const request = require('supertest');
const { app } = require('../../../app');
const { createTestUser, generateTestToken } = require('../../helpers');
const sinon = require('sinon');
const { errorHandler } = require('../../../middleware/errorHandler');
const { createTestResponse, createTestNext, createTestError } = require('../../../test/utils');

describe('Error Handler Middleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {};
    res = createTestResponse();
    next = createTestNext();
  });

  describe('Validation Error', () => {
    it('should handle mongoose validation error', async () => {
      const response = await request(app)
        .post('/api/users/register')
        .send({
          email: 'invalid-email',
          password: '123' // too short
        });

      expect(response.status).to.equal(400);
      expect(response.body).to.have.property('errors');
      expect(response.body.errors).to.be.an('array');
      expect(response.body.errors[0]).to.have.property('field');
      expect(response.body.errors[0]).to.have.property('message');
    });
  });

  describe('Duplicate Key Error', () => {
    it('should handle duplicate email error', async () => {
      const user = await createTestUser();
      const response = await request(app)
        .post('/api/users/register')
        .send({
          name: 'Test User',
          email: user.email,
          password: 'password123'
        });

      expect(response.status).to.equal(400);
      expect(response.body.message).to.equal('Email already registered');
    });
  });

  describe('Authentication Error', () => {
    it('should handle invalid token error', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).to.equal(401);
      expect(response.body.message).to.equal('Invalid token');
    });

    it('should handle expired token error', async () => {
      const user = await createTestUser();
      const token = generateTestToken(user._id.toString(), 'user', '0s');
      
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).to.equal(401);
      expect(response.body.message).to.equal('Token expired');
    });
  });

  describe('Authorization Error', () => {
    it('should handle admin access denied error', async () => {
      const user = await createTestUser({ role: 'user' });
      const token = generateTestToken(user._id.toString(), 'user');
      
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).to.equal(403);
      expect(response.body.message).to.equal('Admin access required');
    });

    it('should handle owner access denied error', async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const token = generateTestToken(user1._id.toString());
      
      const response = await request(app)
        .get(`/api/users/${user2._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).to.equal(403);
      expect(response.body.message).to.equal('Access denied');
    });
  });

  describe('Not Found Error', () => {
    it('should handle resource not found error', async () => {
      const user = await createTestUser();
      const token = generateTestToken(user._id.toString());
      
      const response = await request(app)
        .get('/api/users/nonexistent-id')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).to.equal(404);
      expect(response.body.message).to.equal('User not found');
    });
  });

  describe('Rate Limiting Error', () => {
    it('should handle rate limit exceeded error', async () => {
      // Make multiple requests in quick succession
      const requests = Array(6).fill().map(() => 
        request(app)
          .post('/api/users/login')
          .send({
            email: 'test@example.com',
            password: 'password123'
          })
      );

      const responses = await Promise.all(requests);
      const rateLimitedResponse = responses.find(r => r.status === 429);

      expect(rateLimitedResponse).to.exist;
      expect(rateLimitedResponse.status).to.equal(429);
      expect(rateLimitedResponse.body.message).to.equal('Too many requests, please try again later');
    });
  });

  describe('Default Error', () => {
    it('should handle unexpected errors', async () => {
      // Simulate an unexpected error by passing invalid data
      const response = await request(app)
        .post('/api/users/register')
        .send({
          name: null,
          email: null,
          password: null
        });

      expect(response.status).to.equal(500);
      expect(response.body.message).to.equal('Internal server error');
    });
  });

  describe('Validation Errors', () => {
    it('should handle validation errors', () => {
      const error = {
        name: 'ValidationError',
        errors: {
          email: { message: 'Invalid email format' },
          password: { message: 'Password is required' }
        }
      };

      errorHandler(error, req, res, next);

      expect(res.status).to.have.been.calledWith(400);
      expect(res.json).to.have.been.calledWith({
        success: false,
        error: 'Validation Error',
        details: {
          email: 'Invalid email format',
          password: 'Password is required'
        }
      });
    });

    it('should handle single validation error', () => {
      const error = {
        name: 'ValidationError',
        errors: {
          email: { message: 'Invalid email format' }
        }
      };

      errorHandler(error, req, res, next);

      expect(res.status).to.have.been.calledWith(400);
      expect(res.json).to.have.been.calledWith({
        success: false,
        error: 'Validation Error',
        details: {
          email: 'Invalid email format'
        }
      });
    });
  });

  describe('Authentication Errors', () => {
    it('should handle JWT errors', () => {
      const error = {
        name: 'JsonWebTokenError',
        message: 'Invalid token'
      };

      errorHandler(error, req, res, next);

      expect(res.status).to.have.been.calledWith(401);
      expect(res.json).to.have.been.calledWith({
        success: false,
        error: 'Authentication Error',
        details: 'Invalid token'
      });
    });

    it('should handle token expiration', () => {
      const error = {
        name: 'TokenExpiredError',
        message: 'Token has expired'
      };

      errorHandler(error, req, res, next);

      expect(res.status).to.have.been.calledWith(401);
      expect(res.json).to.have.been.calledWith({
        success: false,
        error: 'Authentication Error',
        details: 'Token has expired'
      });
    });
  });

  describe('Database Errors', () => {
    it('should handle duplicate key errors', () => {
      const error = {
        name: 'MongoError',
        code: 11000,
        message: 'Duplicate key error'
      };

      errorHandler(error, req, res, next);

      expect(res.status).to.have.been.calledWith(409);
      expect(res.json).to.have.been.calledWith({
        success: false,
        error: 'Database Error',
        details: 'Duplicate key error'
      });
    });

    it('should handle other database errors', () => {
      const error = {
        name: 'MongoError',
        message: 'Database connection error'
      };

      errorHandler(error, req, res, next);

      expect(res.status).to.have.been.calledWith(500);
      expect(res.json).to.have.been.calledWith({
        success: false,
        error: 'Database Error',
        details: 'Database connection error'
      });
    });
  });

  describe('Custom Errors', () => {
    it('should handle custom errors with status code', () => {
      const error = createTestError('Custom error message', 404);

      errorHandler(error, req, res, next);

      expect(res.status).to.have.been.calledWith(404);
      expect(res.json).to.have.been.calledWith({
        success: false,
        error: 'Custom error message'
      });
    });

    it('should handle custom errors without status code', () => {
      const error = new Error('Custom error message');

      errorHandler(error, req, res, next);

      expect(res.status).to.have.been.calledWith(500);
      expect(res.json).to.have.been.calledWith({
        success: false,
        error: 'Custom error message'
      });
    });
  });

  describe('Unknown Errors', () => {
    it('should handle unknown error types', () => {
      const error = new Error('Unknown error');

      errorHandler(error, req, res, next);

      expect(res.status).to.have.been.calledWith(500);
      expect(res.json).to.have.been.calledWith({
        success: false,
        error: 'Unknown error'
      });
    });

    it('should handle null errors', () => {
      errorHandler(null, req, res, next);

      expect(res.status).to.have.been.calledWith(500);
      expect(res.json).to.have.been.calledWith({
        success: false,
        error: 'An unexpected error occurred'
      });
    });
  });
}); 