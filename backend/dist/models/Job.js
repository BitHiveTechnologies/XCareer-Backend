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
exports.jobSchema = exports.Job = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// Job schema
const jobSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: [true, 'Job title is required'],
        trim: true,
        maxlength: [200, 'Job title cannot exceed 200 characters']
    },
    company: {
        type: String,
        required: [true, 'Company name is required'],
        trim: true,
        maxlength: [150, 'Company name cannot exceed 150 characters']
    },
    description: {
        type: String,
        required: [true, 'Job description is required'],
        trim: true,
        maxlength: [5000, 'Job description cannot exceed 5000 characters']
    },
    type: {
        type: String,
        required: [true, 'Job type is required'],
        enum: {
            values: ['job', 'internship'],
            message: 'Job type must be either job or internship'
        }
    },
    eligibility: {
        qualifications: {
            type: [String],
            required: [true, 'At least one qualification is required'],
            validate: {
                validator: function (value) {
                    return value.length > 0;
                },
                message: 'At least one qualification is required'
            }
        },
        streams: {
            type: [String],
            required: [true, 'At least one stream is required'],
            validate: {
                validator: function (value) {
                    return value.length > 0;
                },
                message: 'At least one stream is required'
            }
        },
        passoutYears: {
            type: [Number],
            required: [true, 'At least one passout year is required'],
            validate: {
                validator: function (value) {
                    return value.length > 0 && value.every(year => year >= 2000 && year <= 2030);
                },
                message: 'Passout years must be between 2000 and 2030'
            }
        },
        minCGPA: {
            type: Number,
            min: [0, 'Minimum CGPA cannot be negative'],
            max: [10, 'Minimum CGPA cannot exceed 10'],
            validate: {
                validator: function (value) {
                    if (value !== undefined && (value < 0 || value > 10)) {
                        return false;
                    }
                    return true;
                },
                message: 'Minimum CGPA must be between 0 and 10'
            }
        }
    },
    applicationDeadline: {
        type: Date,
        required: [true, 'Application deadline is required'],
        validate: {
            validator: function (value) {
                return value > new Date();
            },
            message: 'Application deadline must be in the future'
        }
    },
    applicationLink: {
        type: String,
        required: [true, 'Application link is required'],
        trim: true,
        match: [/^https?:\/\/.+/, 'Please provide a valid application link']
    },
    location: {
        type: String,
        required: [true, 'Job location is required'],
        enum: {
            values: ['remote', 'onsite', 'hybrid'],
            message: 'Location must be remote, onsite, or hybrid'
        }
    },
    salary: {
        type: String,
        trim: true,
        maxlength: [100, 'Salary information cannot exceed 100 characters']
    },
    stipend: {
        type: String,
        trim: true,
        maxlength: [100, 'Stipend information cannot exceed 100 characters']
    },
    isActive: {
        type: Boolean,
        default: true
    },
    postedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Admin',
        required: [true, 'Admin ID is required']
    },
    applications: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'JobApplication'
        }]
}, {
    timestamps: true,
    toJSON: {
        transform: function (_doc, ret) {
            delete ret.__v;
            return ret;
        }
    }
});
exports.jobSchema = jobSchema;
// Indexes for performance
jobSchema.index({ title: 1 });
jobSchema.index({ company: 1 });
jobSchema.index({ type: 1 });
jobSchema.index({ location: 1 });
jobSchema.index({ isActive: 1 });
jobSchema.index({ applicationDeadline: 1 });
jobSchema.index({ postedBy: 1 });
jobSchema.index({ createdAt: -1 });
// Compound indexes for common queries
jobSchema.index({ isActive: 1, type: 1 });
jobSchema.index({ isActive: 1, location: 1 });
jobSchema.index({ isActive: 1, applicationDeadline: 1 });
// Individual array field indexes (cannot create compound indexes on multiple array fields)
jobSchema.index({ 'eligibility.qualifications': 1 });
jobSchema.index({ 'eligibility.streams': 1 });
jobSchema.index({ 'eligibility.passoutYears': 1 });
// Text index for search functionality
jobSchema.index({
    title: 'text',
    company: 'text',
    description: 'text'
});
// Pre-save middleware to validate deadline
jobSchema.pre('save', function (next) {
    if (this.applicationDeadline <= new Date()) {
        return next(new Error('Application deadline must be in the future'));
    }
    next();
});
// Pre-update middleware to validate deadline
jobSchema.pre('findOneAndUpdate', function (next) {
    const update = this.getUpdate();
    if (update.applicationDeadline && update.applicationDeadline <= new Date()) {
        return next(new Error('Application deadline must be in the future'));
    }
    next();
});
// Instance method to check if job is still accepting applications
jobSchema.methods.isAcceptingApplications = function () {
    return this.isActive && this.applicationDeadline > new Date();
};
// Instance method to get days until deadline
jobSchema.methods.getDaysUntilDeadline = function () {
    if (!this.isAcceptingApplications())
        return 0;
    const now = new Date();
    const deadline = new Date(this.applicationDeadline);
    const diffTime = deadline.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};
// Instance method to get salary/stipend display
jobSchema.methods.getCompensationDisplay = function () {
    if (this.type === 'job' && this.salary) {
        return this.salary;
    }
    if (this.type === 'internship' && this.stipend) {
        return this.stipend;
    }
    return 'Not specified';
};
// Instance method to check if user is eligible
jobSchema.methods.isUserEligible = function (userProfile) {
    // Check qualification
    const userQualification = userProfile.getQualificationDisplay();
    if (!this.eligibility.qualifications.includes(userQualification)) {
        return false;
    }
    // Check stream
    const userStream = userProfile.getStreamDisplay();
    if (!this.eligibility.streams.includes(userStream)) {
        return false;
    }
    // Check passout year
    if (!this.eligibility.passoutYears.includes(userProfile.yearOfPassout)) {
        return false;
    }
    // Check CGPA if specified
    if (this.eligibility.minCGPA && userProfile.cgpaOrPercentage < this.eligibility.minCGPA) {
        return false;
    }
    return true;
};
// Static method to find active jobs
jobSchema.statics.findActiveJobs = function () {
    return this.find({ isActive: true });
};
// Static method to find jobs by type
jobSchema.statics.findByType = function (type) {
    return this.find({ type, isActive: true });
};
// Static method to find jobs by location
jobSchema.statics.findByLocation = function (location) {
    return this.find({ location, isActive: true });
};
// Static method to find jobs by company
jobSchema.statics.findByCompany = function (company) {
    return this.find({
        company: { $regex: company, $options: 'i' },
        isActive: true
    });
};
// Static method to find jobs expiring soon
jobSchema.statics.findExpiringSoon = function (days = 7) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    return this.find({
        isActive: true,
        applicationDeadline: { $lte: futureDate }
    });
};
// Static method to search jobs by text
jobSchema.statics.searchJobs = function (searchTerm) {
    return this.find({
        $text: { $search: searchTerm },
        isActive: true
    }, {
        score: { $meta: 'textScore' }
    }).sort({ score: { $meta: 'textScore' } });
};
// Virtual for deadline status
jobSchema.virtual('deadlineStatus').get(function () {
    if (!this.isActive)
        return 'inactive';
    const daysUntilDeadline = this.getDaysUntilDeadline();
    if (daysUntilDeadline <= 0)
        return 'expired';
    if (daysUntilDeadline <= 3)
        return 'urgent';
    if (daysUntilDeadline <= 7)
        return 'soon';
    return 'active';
});
// Virtual for compensation display
jobSchema.virtual('compensationDisplay').get(function () {
    return this.getCompensationDisplay();
});
// Virtual for eligibility summary
jobSchema.virtual('eligibilitySummary').get(function () {
    const summary = {
        qualifications: this.eligibility.qualifications.join(', '),
        streams: this.eligibility.streams.join(', '),
        passoutYears: this.eligibility.passoutYears.join(', '),
        minCGPA: this.eligibility.minCGPA || 'Not specified'
    };
    return summary;
});
// Ensure virtuals are serialized
jobSchema.set('toJSON', { virtuals: true });
// Create and export the model
exports.Job = mongoose_1.default.model('Job', jobSchema);
//# sourceMappingURL=Job.js.map