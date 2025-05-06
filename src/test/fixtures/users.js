const { hashPassword } = require('../../services/passwordService');

const mockUsers = {
  regularUser: {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'Password123!',
    role: 'user',
    isEmailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  adminUser: {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'Admin123!',
    role: 'admin',
    isEmailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  unverifiedUser: {
    name: 'Unverified User',
    email: 'unverified@example.com',
    password: 'Password123!',
    role: 'user',
    isEmailVerified: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }
};

const createMockUser = async (type = 'regularUser') => {
  const user = { ...mockUsers[type] };
  user.password = await hashPassword(user.password);
  return user;
};

module.exports = {
  mockUsers,
  createMockUser
}; 