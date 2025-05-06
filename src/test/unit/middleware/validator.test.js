const { expect } = require('chai');
const sinon = require('sinon');
const { validate } = require('../../../middleware/validator');
const { createTestResponse, createTestNext } = require('../../../test/utils');

describe('Validator Middleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      body: {},
      query: {},
      params: {}
    };
    res = createTestResponse();
    next = createTestNext();
  });

  describe('User Validation', () => {
    it('should validate user registration data', () => {
      req.body = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123!'
      };

      validate('register')(req, res, next);

      expect(next).to.have.been.calledOnce;
      expect(res.status).to.not.have.been.called;
    });

    it('should reject invalid user registration data', () => {
      req.body = {
        name: 'John',
        email: 'invalid-email',
        password: 'weak'
      };

      validate('register')(req, res, next);

      expect(res.status).to.have.been.calledWith(400);
      expect(res.json).to.have.been.calledWith({
        success: false,
        error: 'Validation Error',
        details: expect.any(Object)
      });
      expect(next).to.not.have.been.called;
    });

    it('should validate user login data', () => {
      req.body = {
        email: 'john@example.com',
        password: 'Password123!'
      };

      validate('login')(req, res, next);

      expect(next).to.have.been.calledOnce;
      expect(res.status).to.not.have.been.called;
    });

    it('should reject invalid user login data', () => {
      req.body = {
        email: 'invalid-email',
        password: ''
      };

      validate('login')(req, res, next);

      expect(res.status).to.have.been.calledWith(400);
      expect(res.json).to.have.been.calledWith({
        success: false,
        error: 'Validation Error',
        details: expect.any(Object)
      });
      expect(next).to.not.have.been.called;
    });
  });

  describe('Password Reset Validation', () => {
    it('should validate password reset request', () => {
      req.body = {
        email: 'john@example.com'
      };

      validate('requestPasswordReset')(req, res, next);

      expect(next).to.have.been.calledOnce;
      expect(res.status).to.not.have.been.called;
    });

    it('should validate password reset confirmation', () => {
      req.body = {
        token: 'valid-token',
        password: 'NewPassword123!'
      };

      validate('resetPassword')(req, res, next);

      expect(next).to.have.been.calledOnce;
      expect(res.status).to.not.have.been.called;
    });

    it('should reject invalid password reset data', () => {
      req.body = {
        token: '',
        password: 'weak'
      };

      validate('resetPassword')(req, res, next);

      expect(res.status).to.have.been.calledWith(400);
      expect(res.json).to.have.been.calledWith({
        success: false,
        error: 'Validation Error',
        details: expect.any(Object)
      });
      expect(next).to.not.have.been.called;
    });
  });

  describe('Query Parameter Validation', () => {
    it('should validate pagination parameters', () => {
      req.query = {
        page: '1',
        limit: '10'
      };

      validate('pagination')(req, res, next);

      expect(next).to.have.been.calledOnce;
      expect(res.status).to.not.have.been.called;
    });

    it('should reject invalid pagination parameters', () => {
      req.query = {
        page: '-1',
        limit: '0'
      };

      validate('pagination')(req, res, next);

      expect(res.status).to.have.been.calledWith(400);
      expect(res.json).to.have.been.calledWith({
        success: false,
        error: 'Validation Error',
        details: expect.any(Object)
      });
      expect(next).to.not.have.been.called;
    });
  });

  describe('Route Parameter Validation', () => {
    it('should validate route parameters', () => {
      req.params = {
        id: '123456789'
      };

      validate('id')(req, res, next);

      expect(next).to.have.been.calledOnce;
      expect(res.status).to.not.have.been.called;
    });

    it('should reject invalid route parameters', () => {
      req.params = {
        id: 'invalid-id'
      };

      validate('id')(req, res, next);

      expect(res.status).to.have.been.calledWith(400);
      expect(res.json).to.have.been.calledWith({
        success: false,
        error: 'Validation Error',
        details: expect.any(Object)
      });
      expect(next).to.not.have.been.called;
    });
  });

  describe('Error Handling', () => {
    it('should handle validation errors gracefully', () => {
      // Simulate validation error
      const error = new Error('Validation error');
      sinon.stub(validate, 'handler').throws(error);

      validate('register')(req, res, next);

      expect(res.status).to.have.been.calledWith(500);
      expect(res.json).to.have.been.calledWith({
        success: false,
        error: 'Internal server error'
      });

      validate.handler.restore();
    });

    it('should handle missing validation rules', () => {
      validate('nonExistentRule')(req, res, next);

      expect(res.status).to.have.been.calledWith(500);
      expect(res.json).to.have.been.calledWith({
        success: false,
        error: 'Validation rules not found'
      });
      expect(next).to.not.have.been.called;
    });
  });
}); 