const { expect } = require('chai');
const User = require('../../../models/User');
const { createUser, findUserById, findUserByEmail, updateUser, deleteUser, listUsers } = require('./userService');
const { createTestUser } = require('../../helpers');

describe('User Service', () => {
  describe('createUser', () => {
    it('should create a new user', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      };

      const user = await createUser(userData);
      expect(user).to.have.property('_id');
      expect(user.name).to.equal(userData.name);
      expect(user.email).to.equal(userData.email);
      expect(user.password).to.not.equal(userData.password); // Password should be hashed
    });

    it('should not create user with existing email', async () => {
      const existingUser = await createTestUser();
      const userData = {
        name: 'New User',
        email: existingUser.email,
        password: 'password123'
      };

      try {
        await createUser(userData);
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.message).to.equal('Email already registered');
      }
    });

    it('should hash password before saving', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      };

      const user = await createUser(userData);
      const isMatch = await user.comparePassword('password123');
      expect(isMatch).to.be.true;
    });
  });

  describe('findUserById', () => {
    it('should find user by ID', async () => {
      const testUser = await createTestUser();
      const user = await findUserById(testUser._id);
      expect(user).to.exist;
      expect(user._id.toString()).to.equal(testUser._id.toString());
    });

    it('should return null for non-existent ID', async () => {
      const user = await findUserById('nonexistent-id');
      expect(user).to.be.null;
    });
  });

  describe('findUserByEmail', () => {
    it('should find user by email', async () => {
      const testUser = await createTestUser();
      const user = await findUserByEmail(testUser.email);
      expect(user).to.exist;
      expect(user.email).to.equal(testUser.email);
    });

    it('should return null for non-existent email', async () => {
      const user = await findUserByEmail('nonexistent@example.com');
      expect(user).to.be.null;
    });
  });

  describe('updateUser', () => {
    it('should update user fields', async () => {
      const testUser = await createTestUser();
      const updateData = {
        name: 'Updated Name'
      };

      const updatedUser = await updateUser(testUser._id, updateData);
      expect(updatedUser.name).to.equal(updateData.name);
    });

    it('should not update password directly', async () => {
      const testUser = await createTestUser();
      const updateData = {
        password: 'newpassword123'
      };

      const updatedUser = await updateUser(testUser._id, updateData);
      const isMatch = await updatedUser.comparePassword('newpassword123');
      expect(isMatch).to.be.false;
    });

    it('should handle non-existent user', async () => {
      try {
        await updateUser('nonexistent-id', { name: 'New Name' });
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.message).to.equal('User not found');
      }
    });
  });

  describe('deleteUser', () => {
    it('should delete user', async () => {
      const testUser = await createTestUser();
      await deleteUser(testUser._id);
      const deletedUser = await User.findById(testUser._id);
      expect(deletedUser).to.be.null;
    });

    it('should handle non-existent user', async () => {
      try {
        await deleteUser('nonexistent-id');
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.message).to.equal('User not found');
      }
    });
  });

  describe('listUsers', () => {
    it('should list users with pagination', async () => {
      // Create multiple test users
      await Promise.all([
        createTestUser({ name: 'User 1' }),
        createTestUser({ name: 'User 2' }),
        createTestUser({ name: 'User 3' })
      ]);

      const { users, total } = await listUsers({ page: 1, limit: 2 });
      expect(users).to.be.an('array');
      expect(users.length).to.equal(2);
      expect(total).to.equal(3);
    });

    it('should filter users by search query', async () => {
      await Promise.all([
        createTestUser({ name: 'John Doe' }),
        createTestUser({ name: 'Jane Smith' }),
        createTestUser({ name: 'Bob Johnson' })
      ]);

      const { users } = await listUsers({ search: 'John' });
      expect(users).to.be.an('array');
      expect(users.length).to.equal(2);
      expect(users.every(user => user.name.includes('John'))).to.be.true;
    });

    it('should sort users by specified field', async () => {
      await Promise.all([
        createTestUser({ name: 'C' }),
        createTestUser({ name: 'A' }),
        createTestUser({ name: 'B' })
      ]);

      const { users } = await listUsers({ sort: 'name' });
      expect(users[0].name).to.equal('A');
      expect(users[1].name).to.equal('B');
      expect(users[2].name).to.equal('C');
    });
  });

  describe('User Validation', () => {
    it('should validate required fields', async () => {
      try {
        await createUser({});
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.errors).to.have.property('name');
        expect(error.errors).to.have.property('email');
        expect(error.errors).to.have.property('password');
      }
    });

    it('should validate email format', async () => {
      try {
        await createUser({
          name: 'Test User',
          email: 'invalid-email',
          password: 'password123'
        });
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.errors).to.have.property('email');
      }
    });

    it('should validate password strength', async () => {
      try {
        await createUser({
          name: 'Test User',
          email: 'test@example.com',
          password: '123' // too short
        });
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.errors).to.have.property('password');
      }
    });
  });
}); 