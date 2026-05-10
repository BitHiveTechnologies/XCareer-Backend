"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authHeader = void 0;
exports.connectTestDB = connectTestDB;
exports.disconnectTestDB = disconnectTestDB;
exports.clearCollections = clearCollections;
exports.registerTestUser = registerTestUser;
exports.loginTestUser = loginTestUser;
exports.createAuthenticatedUser = createAuthenticatedUser;
const mongoose_1 = __importDefault(require("mongoose"));
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../app"));
/**
 * Connect to the in-memory MongoDB set up by globalSetup.
 * Call this in beforeAll().
 */
async function connectTestDB() {
    const uri = process.env.MONGODB_URI;
    if (mongoose_1.default.connection.readyState === 0) {
        await mongoose_1.default.connect(uri);
    }
}
/**
 * Disconnect and drop the in-memory DB after tests.
 * Call this in afterAll().
 */
async function disconnectTestDB() {
    if (mongoose_1.default.connection.readyState !== 0) {
        await mongoose_1.default.connection.dropDatabase();
        await mongoose_1.default.connection.close();
    }
}
/**
 * Clear all collections between test cases.
 * Call this in beforeEach() or afterEach().
 */
async function clearCollections(...models) {
    for (const model of models) {
        const col = mongoose_1.default.connection.collections[model];
        if (col)
            await col.deleteMany({});
    }
}
/**
 * Register a test user and return the access token.
 */
async function registerTestUser(overrides = {}) {
    const data = {
        email: `test_${Date.now()}@example.com`,
        password: 'TestPass123!',
        name: 'Test User',
        ...overrides
    };
    const res = await (0, supertest_1.default)(app_1.default).post('/api/v1/auth/register').send(data);
    return { res, data };
}
/**
 * Login and return the access token + user id.
 */
async function loginTestUser(email, password) {
    const res = await (0, supertest_1.default)(app_1.default)
        .post('/api/v1/auth/login')
        .send({ email, password });
    return {
        token: res.body?.data?.accessToken,
        userId: res.body?.data?.user?.id,
        res
    };
}
/**
 * Register + login in one call.
 */
async function createAuthenticatedUser(overrides = {}) {
    const { data } = await registerTestUser(overrides);
    const { token, userId, res } = await loginTestUser(data.email, data.password);
    return { email: data.email, password: data.password, token, userId, res };
}
/**
 * Auth header helper.
 */
const authHeader = (token) => ({ Authorization: `Bearer ${token}` });
exports.authHeader = authHeader;
//# sourceMappingURL=helpers.js.map