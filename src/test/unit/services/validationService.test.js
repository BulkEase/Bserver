const { expect } = require('chai');
const { validateEmail, validatePassword, validateName, validateUserData, validatePaginationParams } = require('../../../services/validationService');

describe('Validation Service', () => {
  describe('Email Validation', () => {
    it('should validate correct email format', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.com',
        '123@example.com',
        'test@sub.domain.com'
      ];

      validEmails.forEach(email => {
        expect(validateEmail(email)).to.be.true;
      });
    });

    it('should reject invalid email format', () => {
      const invalidEmails = [
        'invalid-email',
        'test@',
        '@example.com',
        'test@.com',
        'test@com.',
        'test@.com.',
        'test space@example.com'
      ];

      invalidEmails.forEach(email => {
        expect(validateEmail(email)).to.be.false;
      });
    });

    it('should handle empty email', () => {
      expect(validateEmail('')).to.be.false;
    });

    it('should handle null or undefined email', () => {
      expect(validateEmail(null)).to.be.false;
      expect(validateEmail(undefined)).to.be.false;
    });
  });

  describe('Password Validation', () => {
    it('should validate strong password', () => {
      const strongPasswords = [
        'Password123!',
        'Complex@Pass123',
        'StrongP@ssw0rd',
        'MyP@ssw0rd123'
      ];

      strongPasswords.forEach(password => {
        expect(validatePassword(password)).to.be.true;
      });
    });

    it('should reject weak password', () => {
      const weakPasswords = [
        'password',
        '123456',
        'abcdef',
        'Password',
        'password123',
        'PASSWORD123',
        'Pass123'
      ];

      weakPasswords.forEach(password => {
        expect(validatePassword(password)).to.be.false;
      });
    });

    it('should handle empty password', () => {
      expect(validatePassword('')).to.be.false;
    });

    it('should handle null or undefined password', () => {
      expect(validatePassword(null)).to.be.false;
      expect(validatePassword(undefined)).to.be.false;
    });
  });

  describe('Name Validation', () => {
    it('should validate correct name format', () => {
      const validNames = [
        'John Doe',
        'Jane Smith',
        'Robert Johnson',
        'Mary-Jane Wilson',
        'O\'Connor',
        'Jean-Pierre'
      ];

      validNames.forEach(name => {
        expect(validateName(name)).to.be.true;
      });
    });

    it('should reject invalid name format', () => {
      const invalidNames = [
        '123',
        'John123',
        'John@Doe',
        'John_Doe',
        'John*Doe',
        'John#Doe'
      ];

      invalidNames.forEach(name => {
        expect(validateName(name)).to.be.false;
      });
    });

    it('should handle empty name', () => {
      expect(validateName('')).to.be.false;
    });

    it('should handle null or undefined name', () => {
      expect(validateName(null)).to.be.false;
      expect(validateName(undefined)).to.be.false;
    });
  });

  describe('User Data Validation', () => {
    it('should validate complete user data', () => {
      const validUserData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123!',
        role: 'user'
      };

      expect(validateUserData(validUserData)).to.be.true;
    });

    it('should reject incomplete user data', () => {
      const invalidUserData = [
        { email: 'john@example.com', password: 'Password123!' },
        { name: 'John Doe', password: 'Password123!' },
        { name: 'John Doe', email: 'john@example.com' }
      ];

      invalidUserData.forEach(data => {
        expect(validateUserData(data)).to.be.false;
      });
    });

    it('should reject invalid role', () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123!',
        role: 'invalid-role'
      };

      expect(validateUserData(userData)).to.be.false;
    });

    it('should handle empty object', () => {
      expect(validateUserData({})).to.be.false;
    });

    it('should handle null or undefined data', () => {
      expect(validateUserData(null)).to.be.false;
      expect(validateUserData(undefined)).to.be.false;
    });
  });

  describe('Pagination Parameters Validation', () => {
    it('should validate correct pagination parameters', () => {
      const validParams = [
        { page: 1, limit: 10 },
        { page: 2, limit: 20 },
        { page: 1, limit: 50 }
      ];

      validParams.forEach(params => {
        expect(validatePaginationParams(params)).to.be.true;
      });
    });

    it('should reject invalid pagination parameters', () => {
      const invalidParams = [
        { page: 0, limit: 10 },
        { page: 1, limit: 0 },
        { page: -1, limit: 10 },
        { page: 1, limit: -10 },
        { page: 'invalid', limit: 10 },
        { page: 1, limit: 'invalid' }
      ];

      invalidParams.forEach(params => {
        expect(validatePaginationParams(params)).to.be.false;
      });
    });

    it('should handle missing parameters', () => {
      const incompleteParams = [
        { page: 1 },
        { limit: 10 },
        {}
      ];

      incompleteParams.forEach(params => {
        expect(validatePaginationParams(params)).to.be.false;
      });
    });

    it('should handle null or undefined parameters', () => {
      expect(validatePaginationParams(null)).to.be.false;
      expect(validatePaginationParams(undefined)).to.be.false;
    });
  });
}); 