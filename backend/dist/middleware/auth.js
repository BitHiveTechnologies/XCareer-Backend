"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = exports.authenticate = void 0;
/**
 * Basic authentication middleware - placeholder for now
 */
const authenticate = async (req, res, next) => {
    // TODO: Implement proper JWT authentication
    // For now, create a mock user for testing
    req.user = {
        id: 'mock-user-id',
        email: 'mock@example.com',
        role: 'user',
        type: 'user'
    };
    next();
};
exports.authenticate = authenticate;
/**
 * Admin-only middleware - requires admin authentication
 */
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            error: {
                message: 'Authentication required'
            },
            timestamp: new Date().toISOString()
        });
        return;
    }
    if (req.user.type !== 'admin') {
        res.status(403).json({
            success: false,
            error: {
                message: 'Admin access required'
            },
            timestamp: new Date().toISOString()
        });
        return;
    }
    next();
};
exports.requireAdmin = requireAdmin;
//# sourceMappingURL=auth.js.map