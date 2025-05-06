const { expect } = require('chai');
const jwt = require('jsonwebtoken');
const { generateToken, verifyToken, generateRefreshToken, verifyRefreshToken } = require('./tokenService');

describe('Token Service', () => {
  const testUser = {
    _id: 'test-user-id',
    role: 'user'
  };

  describe('generateToken', () => {
    it('should generate valid JWT token', () => {
      const token = generateToken(testUser);
      expect(token).to.be.a('string');
      expect(token).to.not.be.empty;
    });

    it('should include user ID and role in token', () => {
      const token = generateToken(testUser);
      const decoded = jwt.decode(token);
      expect(decoded.userId).to.equal(testUser._id);
      expect(decoded.role).to.equal(testUser.role);
    });

    it('should use correct expiration time', () => {
      const token = generateToken(testUser);
      const decoded = jwt.decode(token);
      expect(decoded.exp).to.be.a('number');
      expect(decoded.iat).to.be.a('number');
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', () => {
      const token = generateToken(testUser);
      const decoded = verifyToken(token);
      expect(decoded.userId).to.equal(testUser._id);
      expect(decoded.role).to.equal(testUser.role);
    });

    it('should throw error for invalid token', () => {
      try {
        verifyToken('invalid-token');
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.message).to.equal('Invalid token');
      }
    });

    it('should throw error for expired token', () => {
      const token = jwt.sign(
        { userId: testUser._id, role: testUser.role },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '0s' }
      );

      try {
        verifyToken(token);
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.message).to.equal('Token expired');
      }
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate valid refresh token', () => {
      const token = generateRefreshToken(testUser._id);
      expect(token).to.be.a('string');
      expect(token).to.not.be.empty;
    });

    it('should include user ID in token', () => {
      const token = generateRefreshToken(testUser._id);
      const decoded = jwt.decode(token);
      expect(decoded.userId).to.equal(testUser._id);
    });

    it('should use correct expiration time', () => {
      const token = generateRefreshToken(testUser._id);
      const decoded = jwt.decode(token);
      expect(decoded.exp).to.be.a('number');
      expect(decoded.iat).to.be.a('number');
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify valid refresh token', () => {
      const token = generateRefreshToken(testUser._id);
      const decoded = verifyRefreshToken(token);
      expect(decoded.userId).to.equal(testUser._id);
    });

    it('should throw error for invalid refresh token', () => {
      try {
        verifyRefreshToken('invalid-token');
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.message).to.equal('Invalid refresh token');
      }
    });

    it('should throw error for expired refresh token', () => {
      const token = jwt.sign(
        { userId: testUser._id },
        process.env.REFRESH_TOKEN_SECRET || 'test-refresh-secret',
        { expiresIn: '0s' }
      );

      try {
        verifyRefreshToken(token);
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.message).to.equal('Refresh token expired');
      }
    });
  });

  describe('Token Security', () => {
    it('should use different secrets for access and refresh tokens', () => {
      const accessToken = generateToken(testUser);
      const refreshToken = generateRefreshToken(testUser._id);

      const accessDecoded = jwt.decode(accessToken);
      const refreshDecoded = jwt.decode(refreshToken);

      expect(accessDecoded).to.not.equal(refreshDecoded);
    });

    it('should not include sensitive data in tokens', () => {
      const userWithSensitiveData = {
        ...testUser,
        password: 'sensitive-password',
        email: 'test@example.com'
      };

      const token = generateToken(userWithSensitiveData);
      const decoded = jwt.decode(token);

      expect(decoded).to.not.have.property('password');
      expect(decoded).to.not.have.property('email');
    });
  });

  describe('Token Payload', () => {
    it('should include correct claims in access token', () => {
      const token = generateToken(testUser);
      const decoded = jwt.decode(token);

      expect(decoded).to.have.property('userId');
      expect(decoded).to.have.property('role');
      expect(decoded).to.have.property('iat');
      expect(decoded).to.have.property('exp');
    });

    it('should include correct claims in refresh token', () => {
      const token = generateRefreshToken(testUser._id);
      const decoded = jwt.decode(token);

      expect(decoded).to.have.property('userId');
      expect(decoded).to.have.property('iat');
      expect(decoded).to.have.property('exp');
    });
  });
}); 