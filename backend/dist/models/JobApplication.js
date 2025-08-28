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
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobApplication = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// Job Application schema
const jobApplicationSchema = new mongoose_1.Schema({
    jobId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Job',
        required: [true, 'Job ID is required']
    },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required']
    },
    status: {
        type: String,
        required: [true, 'Application status is required'],
        enum: {
            values: ['applied', 'shortlisted', 'rejected', 'withdrawn'],
            message: 'Status must be applied, shortlisted, rejected, or withdrawn'
        },
        default: 'applied'
    },
    appliedAt: {
        type: Date,
        required: [true, 'Application date is required'],
        default: Date.now
    },
    resumeUrl: {
        type: String,
        required: [true, 'Resume URL is required'],
        trim: true,
        match: [/^https?:\/\/.+/, 'Please provide a valid resume URL']
    },
    coverLetter: {
        type: String,
        trim: true,
        maxlength: [2000, 'Cover letter cannot exceed 2000 characters']
    },
    adminNotes: {
        type: String,
        trim: true,
        maxlength: [1000, 'Admin notes cannot exceed 1000 characters']
    }
}, {
    timestamps: true,
    toJSON: {
        transform: function (_doc, ret) {
            delete ret.__v;
            return ret;
        }
    }
});
// Indexes for performance
jobApplicationSchema.index({ jobId: 1 });
jobApplicationSchema.index({ userId: 1 });
jobApplicationSchema.index({ status: 1 });
jobApplicationSchema.index({ appliedAt: -1 });
jobApplicationSchema.index({ createdAt: -1 });
// Compound indexes for common queries
jobApplicationSchema.index({ jobId: 1, userId: 1 }, { unique: true });
jobApplicationSchema.index({ jobId: 1, status: 1 });
jobApplicationSchema.index({ userId: 1, status: 1 });
// Pre-save middleware to validate unique application
jobApplicationSchema.pre('save', async function (next) {
    if (this.isNew) {
        const existingApplication = await mongoose_1.default.model('JobApplication').findOne({
            jobId: this.jobId,
            userId: this.userId
        });
        if (existingApplication) {
            return next(new Error('User has already applied for this job'));
        }
    }
    next();
});
// Instance method to check if application can be withdrawn
jobApplicationSchema.methods.canWithdraw = function () {
    return this.status === 'applied';
};
// Instance method to check if application can be updated by admin
jobApplicationSchema.methods.canUpdateStatus = function () {
    return this.status !== 'withdrawn';
};
// Instance method to get application age in days
jobApplicationSchema.methods.getApplicationAge = function () {
    const now = new Date();
    const appliedDate = new Date(this.appliedAt);
    const diffTime = now.getTime() - appliedDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};
// Static method to get application statistics
jobApplicationSchema.statics.getApplicationStats = async function () {
    return this.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        }
    ]);
};
// Static method to get applications by job
jobApplicationSchema.statics.getApplicationsByJob = async function (jobId, options = {}) {
    const { page = 1, limit = 10, status } = options;
    const skip = (page - 1) * limit;
    const query = { jobId };
    if (status) {
        query.status = status;
    }
    const applications = await this.find(query)
        .sort({ appliedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name email profile')
        .populate('jobId', 'title company type');
    const total = await this.countDocuments(query);
    return {
        applications,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
    };
};
// Static method to get user applications
jobApplicationSchema.statics.getUserApplications = async function (userId, options = {}) {
    const { page = 1, limit = 10, status } = options;
    const skip = (page - 1) * limit;
    const query = { userId };
    if (status) {
        query.status = status;
    }
    const applications = await this.find(query)
        .sort({ appliedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('jobId', 'title company type location applicationDeadline')
        .populate('userId', 'name email');
    const total = await this.countDocuments(query);
    return {
        applications,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
    };
};
// Create and export the model
exports.JobApplication = mongoose_1.default.model('JobApplication', jobApplicationSchema);
//# sourceMappingURL=JobApplication.js.map