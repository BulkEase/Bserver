const { expect } = require('chai');
const User = require('./User');
const { hashPassword, comparePasswords } = require('../test/helpers');

describe('User Model', () => {
  describe('Password Hashing', () => {
    it('should hash password before saving', async () => {
      const user = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });

      await user.save();
      expect(user.password).to.not.equal('password123');
      expect(await comparePasswords('password123', user.password)).to.be.true;
    });

    it('should not hash password if not modified', async () => {
      const user = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });

      await user.save();
      const originalPassword = user.password;

      user.name = 'Updated Name';
      await user.save();

      expect(user.password).to.equal(originalPassword);
    });
  });

  describe('Email Verification', () => {
    it('should generate email verification token', async () => {
      const user = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });

      const token = user.generateEmailVerificationToken();
      expect(token).to.be.a('string');
      expect(user.emailVerificationToken).to.be.a('string');
      expect(user.emailVerificationExpires).to.be.a('date');
    });
  });

  describe('Password Reset', () => {
    it('should generate password reset token', async () => {
      const user = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });

      const token = user.generatePasswordResetToken();
      expect(token).to.be.a('string');
      expect(user.passwordResetToken).to.be.a('string');
      expect(user.passwordResetExpires).to.be.a('date');
    });
  });

  describe('Password Comparison', () => {
    it('should correctly compare passwords', async () => {
      const user = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });

      await user.save();
      expect(await user.comparePassword('password123')).to.be.true;
      expect(await user.comparePassword('wrongpassword')).to.be.false;
    });
  });

  describe('Validation', () => {
    it('should require name', async () => {
      const user = new User({
        email: 'test@example.com',
        password: 'password123'
      });

      try {
        await user.save();
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error.errors.name).to.exist;
      }
    });

    it('should require email', async () => {
      const user = new User({
        name: 'Test User',
        password: 'password123'
      });

      try {
        await user.save();
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error.errors.email).to.exist;
      }
    });

    it('should require unique email', async () => {
      const user1 = new User({
        name: 'Test User 1',
        email: 'test@example.com',
        password: 'password123'
      });

      const user2 = new User({
        name: 'Test User 2',
        email: 'test@example.com',
        password: 'password123'
      });

      await user1.save();
      try {
        await user2.save();
        expect.fail('Should have thrown duplicate key error');
      } catch (error) {
        expect(error.code).to.equal(11000);
      }
    });
  });
}); 