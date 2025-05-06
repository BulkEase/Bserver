const { expect } = require('chai');
const request = require('supertest');
const { app } = require('../../../app');
const { createTestUser, generateTestToken } = require('../../helpers');
const sinon = require('sinon');
const { rateLimiter } = require('../../../middleware/rateLimiter');
const { createTestResponse, createTestNext } = require('../../../test/utils');

describe('Rate Limiter Middleware', () => {
  let req;
  let res;
  let next;
  let clock;

  beforeEach(() => {
    req = {
      ip: '127.0.0.1'
    };
    res = createTestResponse();
    next = createTestNext();
    clock = sinon.useFakeTimers();
  });

  afterEach(() => {
    clock.restore();
  });

  describe('Login Rate Limiting', () => {
    it('should allow requests within limit', async () => {
      const requests = Array(5).fill().map(() => 
        request(app)
          .post('/api/users/login')
          .send({
            email: 'test@example.com',
            password: 'password123'
          })
      );

      const responses = await Promise.all(requests);
      const successfulResponses = responses.filter(r => r.status === 200 || r.status === 401);
      
      expect(successfulResponses.length).to.equal(5);
    });

    it('should block requests exceeding limit', async () => {
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

    it('should reset limit after window', async () => {
      // Make initial requests
      const initialRequests = Array(5).fill().map(() => 
        request(app)
          .post('/api/users/login')
          .send({
            email: 'test@example.com',
            password: 'password123'
          })
      );

      await Promise.all(initialRequests);

      // Wait for rate limit window to reset (in test environment, this should be quick)
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Make new requests
      const newRequests = Array(5).fill().map(() => 
        request(app)
          .post('/api/users/login')
          .send({
            email: 'test@example.com',
            password: 'password123'
          })
      );

      const responses = await Promise.all(newRequests);
      const successfulResponses = responses.filter(r => r.status === 200 || r.status === 401);
      
      expect(successfulResponses.length).to.equal(5);
    });
  });

  describe('Registration Rate Limiting', () => {
    it('should allow registration requests within limit', async () => {
      const requests = Array(3).fill().map((_, i) => 
        request(app)
          .post('/api/users/register')
          .send({
            name: `Test User ${i}`,
            email: `test${i}@example.com`,
            password: 'password123'
          })
      );

      const responses = await Promise.all(requests);
      const successfulResponses = responses.filter(r => r.status === 201 || r.status === 400);
      
      expect(successfulResponses.length).to.equal(3);
    });

    it('should block registration requests exceeding limit', async () => {
      const requests = Array(4).fill().map((_, i) => 
        request(app)
          .post('/api/users/register')
          .send({
            name: `Test User ${i}`,
            email: `test${i}@example.com`,
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

  describe('Protected Route Rate Limiting', () => {
    it('should limit requests to protected routes', async () => {
      const user = await createTestUser();
      const token = generateTestToken(user._id.toString());

      const requests = Array(6).fill().map(() => 
        request(app)
          .get('/api/users/profile')
          .set('Authorization', `Bearer ${token}`)
      );

      const responses = await Promise.all(requests);
      const rateLimitedResponse = responses.find(r => r.status === 429);

      expect(rateLimitedResponse).to.exist;
      expect(rateLimitedResponse.status).to.equal(429);
      expect(rateLimitedResponse.body.message).to.equal('Too many requests, please try again later');
    });

    it('should not count failed auth requests towards limit', async () => {
      const requests = Array(10).fill().map(() => 
        request(app)
          .get('/api/users/profile')
          .set('Authorization', 'Bearer invalid-token')
      );

      const responses = await Promise.all(requests);
      const unauthorizedResponses = responses.filter(r => r.status === 401);
      
      expect(unauthorizedResponses.length).to.equal(10);
    });
  });

  describe('IP-based Rate Limiting', () => {
    it('should track requests by IP address', async () => {
      const requests = Array(6).fill().map(() => 
        request(app)
          .post('/api/users/login')
          .send({
            email: 'test@example.com',
            password: 'password123'
          })
          .set('X-Forwarded-For', '192.168.1.1')
      );

      const responses = await Promise.all(requests);
      const rateLimitedResponse = responses.find(r => r.status === 429);

      expect(rateLimitedResponse).to.exist;
      expect(rateLimitedResponse.status).to.equal(429);
    });

    it('should allow requests from different IPs', async () => {
      const requests = Array(6).fill().map((_, i) => 
        request(app)
          .post('/api/users/login')
          .send({
            email: 'test@example.com',
            password: 'password123'
          })
          .set('X-Forwarded-For', `192.168.1.${i + 1}`)
      );

      const responses = await Promise.all(requests);
      const successfulResponses = responses.filter(r => r.status === 200 || r.status === 401);
      
      expect(successfulResponses.length).to.equal(6);
    });
  });

  describe('Request Limiting', () => {
    it('should allow requests within limit', () => {
      // Make requests up to the limit
      for (let i = 0; i < 100; i++) {
        rateLimiter(req, res, next);
        expect(next).to.have.been.called;
        next.reset();
      }

      // Verify no error response
      expect(res.status).to.not.have.been.called;
    });

    it('should block requests exceeding limit', () => {
      // Make requests exceeding the limit
      for (let i = 0; i < 101; i++) {
        rateLimiter(req, res, next);
        next.reset();
      }

      // Verify error response
      expect(res.status).to.have.been.calledWith(429);
      expect(res.json).to.have.been.calledWith({
        success: false,
        error: 'Too many requests, please try again later'
      });
    });

    it('should reset limit after window period', () => {
      // Make requests up to the limit
      for (let i = 0; i < 100; i++) {
        rateLimiter(req, res, next);
        next.reset();
      }

      // Advance time past the window period
      clock.tick(15 * 60 * 1000 + 1000); // 15 minutes + 1 second

      // Make another request
      rateLimiter(req, res, next);

      // Verify request is allowed
      expect(next).to.have.been.called;
      expect(res.status).to.not.have.been.called;
    });
  });

  describe('IP-based Limiting', () => {
    it('should track limits separately for different IPs', () => {
      const req2 = {
        ip: '127.0.0.2'
      };

      // Make requests from first IP
      for (let i = 0; i < 100; i++) {
        rateLimiter(req, res, next);
        next.reset();
      }

      // Make requests from second IP
      for (let i = 0; i < 100; i++) {
        rateLimiter(req2, res, next);
        next.reset();
      }

      // Verify both IPs can make requests
      expect(res.status).to.not.have.been.called;
    });

    it('should handle requests without IP', () => {
      delete req.ip;
      rateLimiter(req, res, next);

      expect(next).to.have.been.called;
      expect(res.status).to.not.have.been.called;
    });
  });

  describe('Error Handling', () => {
    it('should handle rate limiter errors gracefully', () => {
      // Simulate rate limiter error
      const error = new Error('Rate limiter error');
      sinon.stub(rateLimiter, 'handler').throws(error);

      rateLimiter(req, res, next);

      expect(res.status).to.have.been.calledWith(500);
      expect(res.json).to.have.been.calledWith({
        success: false,
        error: 'Internal server error'
      });

      rateLimiter.handler.restore();
    });
  });

  describe('Configuration', () => {
    it('should respect configured window period', () => {
      // Make requests up to the limit
      for (let i = 0; i < 100; i++) {
        rateLimiter(req, res, next);
        next.reset();
      }

      // Advance time to just before window period
      clock.tick(14 * 60 * 1000); // 14 minutes

      // Make another request
      rateLimiter(req, res, next);

      // Verify request is blocked
      expect(res.status).to.have.been.calledWith(429);
    });

    it('should respect configured max requests', () => {
      const customLimiter = rateLimiter({
        windowMs: 15 * 60 * 1000,
        max: 50
      });

      // Make requests up to custom limit
      for (let i = 0; i < 50; i++) {
        customLimiter(req, res, next);
        next.reset();
      }

      // Make one more request
      customLimiter(req, res, next);

      // Verify request is blocked
      expect(res.status).to.have.been.calledWith(429);
    });
  });
}); 