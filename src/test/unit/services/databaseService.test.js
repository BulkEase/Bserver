const { expect } = require('chai');
const mongoose = require('mongoose');
const { connectDB, disconnectDB, clearDatabase } = require('./databaseService');

describe('Database Service', () => {
  describe('Database Connection', () => {
    it('should connect to MongoDB', async () => {
      await connectDB();
      expect(mongoose.connection.readyState).to.equal(1); // 1 = connected
    });

    it('should handle connection errors', async () => {
      // Temporarily modify the connection string to cause an error
      const originalUri = process.env.MONGODB_URI;
      process.env.MONGODB_URI = 'mongodb://invalid-host:27017/test';

      try {
        await connectDB();
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).to.be.an('error');
        expect(error.message).to.include('connect ECONNREFUSED');
      }

      // Restore the original connection string
      process.env.MONGODB_URI = originalUri;
    });

    it('should handle connection timeout', async () => {
      // Temporarily modify the connection string to cause a timeout
      const originalUri = process.env.MONGODB_URI;
      process.env.MONGODB_URI = 'mongodb://localhost:27018/test'; // Invalid port

      try {
        await connectDB();
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).to.be.an('error');
        expect(error.message).to.include('connect ECONNREFUSED');
      }

      // Restore the original connection string
      process.env.MONGODB_URI = originalUri;
    });
  });

  describe('Database Disconnection', () => {
    it('should disconnect from MongoDB', async () => {
      await connectDB();
      await disconnectDB();
      expect(mongoose.connection.readyState).to.equal(0); // 0 = disconnected
    });

    it('should handle disconnection when not connected', async () => {
      await disconnectDB();
      expect(mongoose.connection.readyState).to.equal(0);
    });
  });

  describe('Database Clearing', () => {
    it('should clear all collections', async () => {
      await connectDB();

      // Create test data
      const TestModel = mongoose.model('Test', new mongoose.Schema({ name: String }));
      await TestModel.create({ name: 'test' });

      // Clear database
      await clearDatabase();

      // Verify data is cleared
      const count = await TestModel.countDocuments();
      expect(count).to.equal(0);
    });

    it('should handle clearing empty database', async () => {
      await connectDB();
      await clearDatabase();
      // Should not throw any errors
    });

    it('should handle clearing when not connected', async () => {
      await disconnectDB();
      try {
        await clearDatabase();
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.message).to.equal('Database not connected');
      }
    });
  });

  describe('Connection Events', () => {
    it('should emit connected event', async () => {
      let connected = false;
      mongoose.connection.once('connected', () => {
        connected = true;
      });

      await connectDB();
      expect(connected).to.be.true;
    });

    it('should emit disconnected event', async () => {
      let disconnected = false;
      mongoose.connection.once('disconnected', () => {
        disconnected = true;
      });

      await connectDB();
      await disconnectDB();
      expect(disconnected).to.be.true;
    });

    it('should emit error event', async () => {
      let errorEmitted = false;
      mongoose.connection.once('error', () => {
        errorEmitted = true;
      });

      // Temporarily modify the connection string to cause an error
      const originalUri = process.env.MONGODB_URI;
      process.env.MONGODB_URI = 'mongodb://invalid-host:27017/test';

      try {
        await connectDB();
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(errorEmitted).to.be.true;
      }

      // Restore the original connection string
      process.env.MONGODB_URI = originalUri;
    });
  });

  describe('Connection Options', () => {
    it('should use correct connection options', async () => {
      const options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000
      };

      await connectDB(options);
      expect(mongoose.connection.options.useNewUrlParser).to.be.true;
      expect(mongoose.connection.options.useUnifiedTopology).to.be.true;
      expect(mongoose.connection.options.serverSelectionTimeoutMS).to.equal(5000);
    });

    it('should handle invalid connection options', async () => {
      const invalidOptions = {
        invalidOption: true
      };

      try {
        await connectDB(invalidOptions);
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).to.be.an('error');
      }
    });
  });

  describe('Connection State Management', () => {
    it('should maintain connection state', async () => {
      await connectDB();
      expect(mongoose.connection.readyState).to.equal(1);

      await disconnectDB();
      expect(mongoose.connection.readyState).to.equal(0);

      await connectDB();
      expect(mongoose.connection.readyState).to.equal(1);
    });

    it('should handle multiple connection attempts', async () => {
      await connectDB();
      await connectDB(); // Second attempt should not throw error
      expect(mongoose.connection.readyState).to.equal(1);
    });

    it('should handle multiple disconnection attempts', async () => {
      await connectDB();
      await disconnectDB();
      await disconnectDB(); // Second attempt should not throw error
      expect(mongoose.connection.readyState).to.equal(0);
    });
  });
}); 