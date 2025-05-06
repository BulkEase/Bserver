const { expect } = require('chai');
const request = require('supertest');
const { app } = require('../app');
const User = require('../models/User');
const { createTestUser, generateTestToken, generateTestRefreshToken } = require('../test/helpers');

describe('User Controller', () => {
  describe('POST /api/users/register', () => {
    it('should register a new user', async () => {
      const userData = {
        name: 'New User',
        email: 'new@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/users/register')
        .send(userData);

      expect(response.status).to.equal(201);
      expect(response.body).to.have.property('message');
      expect(response.body).to.have.property('userId');

      const user = await User.findById(response.body.userId);
      expect(user).to.exist;
      expect(user.email).to.equal(userData.email);
      expect(user.isEmailVerified).to.be.false;
    });

    it('should not register user with existing email', async () => {
      const existingUser = await createTestUser();
      const userData = {
        name: 'New User',
        email: existingUser.email,
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/users/register')
        .send(userData);

      expect(response.status).to.equal(400);
      expect(response.body.message).to.equal('Email already registered');
    });
  });

  describe('POST /api/users/login', () => {
    it('should login with valid credentials', async () => {
      const user = await createTestUser();
      const loginData = {
        email: user.email,
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/users/login')
        .send(loginData);

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('user');
      expect(response.body).to.have.property('accessToken');
      expect(response.body).to.have.property('refreshToken');
    });

    it('should not login with unverified email', async () => {
      const user = await createTestUser({ isEmailVerified: false });
      const loginData = {
        email: user.email,
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/users/login')
        .send(loginData);

      expect(response.status).to.equal(401);
      expect(response.body.message).to.equal('Please verify your email first');
    });

    it('should not login with invalid credentials', async () => {
      const user = await createTestUser();
      const loginData = {
        email: user.email,
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/users/login')
        .send(loginData);

      expect(response.status).to.equal(401);
      expect(response.body.message).to.equal('Invalid email or password');
    });
  });

  describe('POST /api/users/verify-email/:token', () => {
    it('should verify email with valid token', async () => {
      const user = await createTestUser({ isEmailVerified: false });
      const token = user.generateEmailVerificationToken();
      await user.save();

      const response = await request(app)
        .post(`/api/users/verify-email/${token}`);

      expect(response.status).to.equal(200);
      expect(response.body.message).to.equal('Email verified successfully');

      const updatedUser = await User.findById(user._id);
      expect(updatedUser.isEmailVerified).to.be.true;
    });

    it('should not verify email with invalid token', async () => {
      const response = await request(app)
        .post('/api/users/verify-email/invalid-token');

      expect(response.status).to.equal(400);
      expect(response.body.message).to.equal('Invalid or expired verification token');
    });
  });

  describe('POST /api/users/forgot-password', () => {
    it('should send password reset email', async () => {
      const user = await createTestUser();
      const response = await request(app)
        .post('/api/users/forgot-password')
        .send({ email: user.email });

      expect(response.status).to.equal(200);
      expect(response.body.message).to.equal('Password reset email sent');

      const updatedUser = await User.findById(user._id);
      expect(updatedUser.passwordResetToken).to.exist;
      expect(updatedUser.passwordResetExpires).to.exist;
    });

    it('should handle non-existent email', async () => {
      const response = await request(app)
        .post('/api/users/forgot-password')
        .send({ email: 'nonexistent@example.com' });

      expect(response.status).to.equal(404);
      expect(response.body.message).to.equal('User not found');
    });
  });

  describe('POST /api/users/reset-password/:token', () => {
    it('should reset password with valid token', async () => {
      const user = await createTestUser();
      const token = user.generatePasswordResetToken();
      await user.save();

      const response = await request(app)
        .post(`/api/users/reset-password/${token}`)
        .send({ password: 'newpassword123' });

      expect(response.status).to.equal(200);
      expect(response.body.message).to.equal('Password reset successful');

      const updatedUser = await User.findById(user._id);
      expect(await updatedUser.comparePassword('newpassword123')).to.be.true;
    });

    it('should not reset password with invalid token', async () => {
      const response = await request(app)
        .post('/api/users/reset-password/invalid-token')
        .send({ password: 'newpassword123' });

      expect(response.status).to.equal(400);
      expect(response.body.message).to.equal('Invalid or expired reset token');
    });
  });

  describe('POST /api/users/refresh-token', () => {
    it('should refresh access token', async () => {
      const user = await createTestUser();
      const refreshToken = generateTestRefreshToken(user._id.toString());
      user.refreshToken = refreshToken;
      await user.save();

      const response = await request(app)
        .post('/api/users/refresh-token')
        .send({ refreshToken });

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('accessToken');
    });

    it('should not refresh with invalid token', async () => {
      const response = await request(app)
        .post('/api/users/refresh-token')
        .send({ refreshToken: 'invalid-token' });

      expect(response.status).to.equal(401);
      expect(response.body.message).to.equal('Invalid refresh token');
    });
  });

  describe('Protected Routes', () => {
    let user;
    let token;

    beforeEach(async () => {
      user = await createTestUser();
      token = generateTestToken(user._id.toString());
    });

    describe('GET /api/users/profile', () => {
      it('should get user profile', async () => {
        const response = await request(app)
          .get('/api/users/profile')
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).to.equal(200);
        expect(response.body.email).to.equal(user.email);
      });

      it('should not get profile without token', async () => {
        const response = await request(app)
          .get('/api/users/profile');

        expect(response.status).to.equal(401);
        expect(response.body.message).to.equal('No token provided');
      });
    });

    describe('PUT /api/users/profile', () => {
      it('should update user profile', async () => {
        const updateData = {
          name: 'Updated Name'
        };

        const response = await request(app)
          .put('/api/users/profile')
          .set('Authorization', `Bearer ${token}`)
          .send(updateData);

        expect(response.status).to.equal(200);
        expect(response.body.name).to.equal(updateData.name);
      });
    });

    describe('DELETE /api/users/profile', () => {
      it('should delete user profile', async () => {
        const response = await request(app)
          .delete('/api/users/profile')
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).to.equal(200);
        expect(response.body.message).to.equal('User deleted successfully');

        const deletedUser = await User.findById(user._id);
        expect(deletedUser).to.be.null;
      });
    });
  });
}); 