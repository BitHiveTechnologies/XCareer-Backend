"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = globalSetup;
const mongodb_memory_server_1 = require("mongodb-memory-server");
let mongoServer;
async function globalSetup() {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-jwt-secret-key-minimum-32-chars!!';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-minimum-32!!';
    process.env.CASHFREE_CLIENT_ID = 'test-cf-client-id';
    process.env.CASHFREE_CLIENT_SECRET = 'test-cf-client-secret';
    process.env.CASHFREE_WEBHOOK_SECRET = 'test-webhook-secret';
    process.env.CASHFREE_ENV = 'sandbox';
    process.env.CASHFREE_API_VERSION = '2023-08-01';
    process.env.FRONTEND_URL = 'http://localhost:3000';
    process.env.BCRYPT_ROUNDS = '4'; // Fast for tests
    mongoServer = await mongodb_memory_server_1.MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    process.env.MONGODB_URI = mongoUri;
    process.env.MONGO_URI = mongoUri;
    // Store so teardown can access
    global.__MONGO_SERVER__ = mongoServer;
}
//# sourceMappingURL=setup.js.map