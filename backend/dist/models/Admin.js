"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminSchema = exports.Admin = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const environment_1 = require("../config/environment");
// Admin schema
const adminSchema = new mongoose_1.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters long']
    },
    name: {
        type: String,
        required: [true, 'Admin name is required'],
        trim: true,
        maxlength: [100, 'Admin name cannot exceed 100 characters']
    },
    role: {
        type: String,
        required: [true, 'Admin role is required'],
        enum: {
            values: ['super_admin', 'admin'],
            message: 'Admin role must be either super_admin or admin'
        },
        default: 'admin'
    },
    permissions: {
        type: [String],
        default: [],
        validate: {
            validator: function (value) {
                const validPermissions = [
                    'user_management',
                    'job_management',
                    'subscription_management',
                    'admin_management',
                    'system_settings',
                    'analytics_view',
                    'payment_management',
                    'email_management'
                ];
                return value.every(permission => validPermissions.includes(permission));
            },
            message: 'Invalid permission specified'
        }
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    toJSON: {
        transform: function (_doc, ret) {
            delete ret.password;
            delete ret.__v;
            return ret;
        }
    }
});
exports.adminSchema = adminSchema;
// Indexes for performance
adminSchema.index({ email: 1 });
adminSchema.index({ role: 1 });
adminSchema.index({ isActive: 1 });
adminSchema.index({ createdAt: -1 });
// Pre-save middleware to hash password
adminSchema.pre('save', async function (next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password'))
        return next();
    try {
        // Hash password with configured rounds
        const salt = await bcryptjs_1.default.genSalt(environment_1.config.BCRYPT_ROUNDS);
        this.password = await bcryptjs_1.default.hash(this.password, salt);
        next();
    }
    catch (error) {
        next(error);
    }
});
// Pre-update middleware to hash password on updates
adminSchema.pre('findOneAndUpdate', async function (next) {
    const update = this.getUpdate();
    if (update.password) {
        try {
            const salt = await bcryptjs_1.default.genSalt(environment_1.config.BCRYPT_ROUNDS);
            update.password = await bcryptjs_1.default.hash(update.password, salt);
        }
        catch (error) {
            next(error);
        }
    }
    next();
});
// Instance method to compare password
adminSchema.methods.comparePassword = async function (candidatePassword) {
    try {
        return await bcryptjs_1.default.compare(candidatePassword, this.password);
    }
    catch (error) {
        throw new Error('Password comparison failed');
    }
};
// Instance method to check if admin has specific permission
adminSchema.methods.hasPermission = function (permission) {
    // Super admin has all permissions
    if (this.role === 'super_admin')
        return true;
    return this.permissions.includes(permission);
};
// Instance method to check if admin has any of the specified permissions
adminSchema.methods.hasAnyPermission = function (permissions) {
    // Super admin has all permissions
    if (this.role === 'super_admin')
        return true;
    return permissions.some(permission => this.permissions.includes(permission));
};
// Instance method to check if admin has all of the specified permissions
adminSchema.methods.hasAllPermissions = function (permissions) {
    // Super admin has all permissions
    if (this.role === 'super_admin')
        return true;
    return permissions.every(permission => this.permissions.includes(permission));
};
// Instance method to add permission
adminSchema.methods.addPermission = function (permission) {
    if (!this.permissions.includes(permission)) {
        this.permissions.push(permission);
        return true;
    }
    return false;
};
// Instance method to remove permission
adminSchema.methods.removePermission = function (permission) {
    const index = this.permissions.indexOf(permission);
    if (index > -1) {
        this.permissions.splice(index, 1);
        return true;
    }
    return false;
};
// Instance method to get role display name
adminSchema.methods.getRoleDisplay = function () {
    return this.role === 'super_admin' ? 'Super Administrator' : 'Administrator';
};
// Static method to find admins by role
adminSchema.statics.findByRole = function (role) {
    return this.find({ role, isActive: true });
};
// Static method to find active admins
adminSchema.statics.findActiveAdmins = function () {
    return this.find({ isActive: true });
};
// Static method to find admins with specific permission
adminSchema.statics.findByPermission = function (permission) {
    return this.find({
        $or: [
            { role: 'super_admin' },
            { permissions: permission }
        ],
        isActive: true
    });
};
// Virtual for role display
adminSchema.virtual('roleDisplay').get(function () {
    return this.getRoleDisplay();
});
// Virtual for permissions display
adminSchema.virtual('permissionsDisplay').get(function () {
    if (this.role === 'super_admin') {
        return 'All Permissions';
    }
    return this.permissions.length > 0 ? this.permissions.join(', ') : 'No specific permissions';
});
// Ensure virtuals are serialized
adminSchema.set('toJSON', { virtuals: true });
// Create and export the model
exports.Admin = mongoose_1.default.model('Admin', adminSchema);
//# sourceMappingURL=Admin.js.map