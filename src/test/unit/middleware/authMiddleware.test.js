const { expect } = require('chai');
const sinon = require('sinon');
const jwt = require('jsonwebtoken');
const { config } = require('../../../services/configService');
const { authenticate, authorize } = require('../../../middleware/authMiddleware');
const { createTestResponse, createTestNext, createTestError } = require('../../../test/utils');

describe('Auth Middleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      headers: {}
    };
    res = createTestResponse();
    next = createTestNext();
  });

  describe('authenticate', () => {
    it('should pass authentication with valid token', () => {
      const userId = '123456789';
      const token = jwt.sign({ userId }, config.jwt.secret, { expiresIn: '1h' });
      req.headers.authorization = `Bearer ${token}`;

      authenticate(req, res, next);

      expect(req.user).to.exist;
      expect(req.user.userId).to.equal(userId);
      expect(next).to.have.been.calledOnce;
    });

    it('should reject request without token', () => {
      authenticate(req, res, next);

      expect(res.status).to.have.been.calledWith(401);
      expect(res.json).to.have.been.calledWith({
        success: false,
        error: 'No token provided'
      });
      expect(next).to.not.have.been.called;
    });

    it('should reject request with invalid token format', () => {
      req.headers.authorization = 'InvalidFormat token';

      authenticate(req, res, next);

      expect(res.status).to.have.been.calledWith(401);
      expect(res.json).to.have.been.calledWith({
        success: false,
        error: 'Invalid token format'
      });
      expect(next).to.not.have.been.called;
    });

    it('should reject request with expired token', () => {
      const token = jwt.sign({ userId: '123' }, config.jwt.secret, { expiresIn: '0s' });
      req.headers.authorization = `Bearer ${token}`;

      authenticate(req, res, next);

      expect(res.status).to.have.been.calledWith(401);
      expect(res.json).to.have.been.calledWith({
        success: false,
        error: 'Token has expired'
      });
      expect(next).to.not.have.been.called;
    });

    it('should reject request with invalid token', () => {
      req.headers.authorization = 'Bearer invalid-token';

      authenticate(req, res, next);

      expect(res.status).to.have.been.calledWith(401);
      expect(res.json).to.have.been.calledWith({
        success: false,
        error: 'Invalid token'
      });
      expect(next).to.not.have.been.called;
    });
  });

  describe('authorize', () => {
    it('should allow access for admin role', () => {
      req.user = { role: 'admin' };
      authorize(['admin'])(req, res, next);

      expect(next).to.have.been.calledOnce;
    });

    it('should allow access for user role', () => {
      req.user = { role: 'user' };
      authorize(['user'])(req, res, next);

      expect(next).to.have.been.calledOnce;
    });

    it('should reject access for unauthorized role', () => {
      req.user = { role: 'user' };
      authorize(['admin'])(req, res, next);

      expect(res.status).to.have.been.calledWith(403);
      expect(res.json).to.have.been.calledWith({
        success: false,
        error: 'Access denied'
      });
      expect(next).to.not.have.been.called;
    });

    it('should reject access when no user role is present', () => {
      req.user = {};
      authorize(['admin'])(req, res, next);

      expect(res.status).to.have.been.calledWith(403);
      expect(res.json).to.have.been.calledWith({
        success: false,
        error: 'Access denied'
      });
      expect(next).to.not.have.been.called;
    });

    it('should allow access for multiple roles', () => {
      req.user = { role: 'user' };
      authorize(['admin', 'user'])(req, res, next);

      expect(next).to.have.been.calledOnce;
    });
  });

  describe('Error Handling', () => {
    it('should handle JWT verification errors', () => {
      const token = 'invalid-token';
      req.headers.authorization = `Bearer ${token}`;

      authenticate(req, res, next);

      expect(res.status).to.have.been.calledWith(401);
      expect(res.json).to.have.been.calledWith({
        success: false,
        error: 'Invalid token'
      });
    });

    it('should handle missing authorization header', () => {
      delete req.headers.authorization;

      authenticate(req, res, next);

      expect(res.status).to.have.been.calledWith(401);
      expect(res.json).to.have.been.calledWith({
        success: false,
        error: 'No token provided'
      });
    });
  });
}); 