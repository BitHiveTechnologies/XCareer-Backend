"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = exports.authenticate = void 0;
/**
 * Basic authentication middleware - placeholder for now
 */
const authenticate = async (req, res, next) => {
    // TODO: Implement proper JWT authentication
    // For now, create a mock admin user for testing job creation
    req.user = {
        id: '507f1f77bcf86cd799439011', // Valid ObjectId for testing
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        type: 'admin'
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