const mongoose = require('mongoose');
const { expect } = require('chai');
const sinon = require('sinon');

// Helper to create a test database connection
const createTestConnection = async () => {
  const connection = await mongoose.createConnection(process.env.MONGODB_URI || 'mongodb://localhost:27017/test-db');
  return connection;
};

// Helper to clear all collections in a database
const clearCollections = async (connection) => {
  const collections = connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};

// Helper to create a test model
const createTestModel = (name, schema) => {
  return mongoose.model(name, schema);
};

// Helper to create a test document
const createTestDocument = async (Model, data) => {
  const document = new Model(data);
  await document.save();
  return document;
};

// Helper to create a test request with authentication
const createAuthenticatedRequest = (user, overrides = {}) => {
  return {
    user,
    body: {},
    params: {},
    query: {},
    headers: {},
    ...overrides
  };
};

// Helper to create a test response
const createTestResponse = () => {
  const res = {
    status: sinon.stub().returnsThis(),
    json: sinon.stub().returnsThis(),
    send: sinon.stub().returnsThis()
  };
  return res;
};

// Helper to create a test next function
const createTestNext = () => {
  return sinon.spy();
};

// Helper to verify error response
const verifyErrorResponse = (res, statusCode, message) => {
  expect(res.status).to.have.been.calledWith(statusCode);
  expect(res.json).to.have.been.calledWith({
    success: false,
    error: message
  });
};

// Helper to verify success response
const verifySuccessResponse = (res, statusCode, data) => {
  expect(res.status).to.have.been.calledWith(statusCode);
  expect(res.json).to.have.been.calledWith({
    success: true,
    data
  });
};

// Helper to create a test error
const createTestError = (message, statusCode = 500) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

// Helper to mock service
const mockService = (service, method, returnValue) => {
  return sinon.stub(service, method).resolves(returnValue);
};

// Helper to restore all mocks
const restoreMocks = () => {
  sinon.restore();
};

module.exports = {
  createTestConnection,
  clearCollections,
  createTestModel,
  createTestDocument,
  createAuthenticatedRequest,
  createTestResponse,
  createTestNext,
  verifyErrorResponse,
  verifySuccessResponse,
  createTestError,
  mockService,
  restoreMocks
}; 