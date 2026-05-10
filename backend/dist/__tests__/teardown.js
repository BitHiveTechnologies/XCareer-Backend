"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = globalTeardown;
async function globalTeardown() {
    const mongoServer = global.__MONGO_SERVER__;
    if (mongoServer) {
        await mongoServer.stop();
    }
}
//# sourceMappingURL=teardown.js.map