const { expect } = require('chai');
const request = require('supertest');
const { app } = require('../../../app');
const { createTestUser, generateTestToken } = require('../../helpers');
const { verifyToken, isAdmin, isOwner, authenticate } = require('../../../middleware/auth');

describe('Auth Middleware', () => {
  describe('verifyToken', () => {
    it('should pass with valid token', async () => {
      const user = await createTestUser();
      const token = generateTestToken(user._id.toString());
      
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).to.equal(200);
    });

    it('should fail without token', async () => {
      const response = await request(app)
        .get('/api/users/profile');

      expect(response.status).to.equal(401);
      expect(response.body.message).to.equal('No token provided');
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).to.equal(401);
      expect(response.body.message).to.equal('Invalid token');
    });
  });

  describe('isAdmin', () => {
    it('should pass for admin user', async () => {
      const adminUser = await createTestUser({ role: 'admin' });
      const token = generateTestToken(adminUser._id.toString(), 'admin');
      
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).to.equal(200);
    });

    it('should fail for non-admin user', async () => {
      const regularUser = await createTestUser({ role: 'user' });
      const token = generateTestToken(regularUser._id.toString(), 'user');
      
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).to.equal(403);
      expect(response.body.message).to.equal('Admin access required');
    });
  });

  describe('isOwner', () => {
    it('should pass for owner', async () => {
      const user = await createTestUser();
      const token = generateTestToken(user._id.toString());
      
      const response = await request(app)
        .get(`/api/users/${user._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).to.equal(200);
    });

    it('should pass for admin', async () => {
      const adminUser = await createTestUser({ role: 'admin' });
      const regularUser = await createTestUser();
      const token = generateTestToken(adminUser._id.toString(), 'admin');
      
      const response = await request(app)
        .get(`/api/users/${regularUser._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).to.equal(200);
    });

    it('should fail for non-owner', async () => {
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

  describe('authenticate', () => {
    it('should pass with valid token', async () => {
      const user = await createTestUser();
      const token = generateTestToken(user._id.toString());
      
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).to.equal(200);
    });

    it('should fail with expired token', async () => {
      const user = await createTestUser();
      const token = generateTestToken(user._id.toString(), 'user', '0s');
      
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).to.equal(401);
      expect(response.body.message).to.equal('Token expired');
    });

    it('should fail with invalid token format', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'InvalidFormat');

      expect(response.status).to.equal(401);
      expect(response.body.message).to.equal('No token provided');
    });
  });
}); 