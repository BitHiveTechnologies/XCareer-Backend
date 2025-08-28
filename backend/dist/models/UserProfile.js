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
exports.userProfileSchema = exports.UserProfile = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// User Profile schema
const userProfileSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        unique: true
    },
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
        maxlength: [50, 'First name cannot exceed 50 characters']
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true,
        maxlength: [50, 'Last name cannot exceed 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    contactNumber: {
        type: String,
        required: [true, 'Contact number is required'],
        match: [/^[6-9]\d{9}$/, 'Please enter a valid Indian mobile number']
    },
    dateOfBirth: {
        type: Date,
        required: [true, 'Date of birth is required'],
        validate: {
            validator: function (value) {
                const today = new Date();
                const age = today.getFullYear() - value.getFullYear();
                const monthDiff = today.getMonth() - value.getMonth();
                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < value.getDate())) {
                    return age - 1 >= 16; // Minimum age 16
                }
                return age >= 16;
            },
            message: 'User must be at least 16 years old'
        }
    },
    qualification: {
        type: String,
        required: [true, 'Qualification is required'],
        enum: {
            values: [
                '10th',
                '12th',
                'Diploma',
                'B.E',
                'B.Tech',
                'B.Sc',
                'B.Com',
                'BBA',
                'BCA',
                'M.E',
                'M.Tech',
                'M.Sc',
                'M.Com',
                'MBA',
                'MCA',
                'PhD',
                'Others'
            ],
            message: 'Please select a valid qualification'
        }
    },
    customQualification: {
        type: String,
        trim: true,
        maxlength: [100, 'Custom qualification cannot exceed 100 characters'],
        validate: {
            validator: function (value) {
                if (this.qualification === 'Others' && !value) {
                    return false;
                }
                return true;
            },
            message: 'Custom qualification is required when "Others" is selected'
        }
    },
    stream: {
        type: String,
        required: [true, 'Stream is required'],
        enum: {
            values: [
                'CSE',
                'IT',
                'ECE',
                'EEE',
                'ME',
                'CE',
                'Chemical',
                'Biotech',
                'Civil',
                'Mechanical',
                'Electrical',
                'Computer Science',
                'Information Technology',
                'Electronics',
                'Others'
            ],
            message: 'Please select a valid stream'
        }
    },
    customStream: {
        type: String,
        trim: true,
        maxlength: [100, 'Custom stream cannot exceed 100 characters'],
        validate: {
            validator: function (value) {
                if (this.stream === 'Others' && !value) {
                    return false;
                }
                return true;
            },
            message: 'Custom stream is required when "Others" is selected'
        }
    },
    yearOfPassout: {
        type: Number,
        required: [true, 'Year of passout is required'],
        min: [2000, 'Year of passout must be 2000 or later'],
        max: [2030, 'Year of passout cannot be later than 2030']
    },
    cgpaOrPercentage: {
        type: Number,
        required: [true, 'CGPA or percentage is required'],
        min: [0, 'CGPA/Percentage cannot be negative'],
        max: [10, 'CGPA cannot exceed 10'],
        validate: {
            validator: function (value) {
                // If qualification is 10th or 12th, percentage should be 0-100
                if (['10th', '12th'].includes(this.qualification)) {
                    return value >= 0 && value <= 100;
                }
                // For other qualifications, CGPA should be 0-10
                return value >= 0 && value <= 10;
            },
            message: 'Invalid CGPA/Percentage value for the selected qualification'
        }
    },
    collegeName: {
        type: String,
        required: [true, 'College name is required'],
        trim: true,
        maxlength: [200, 'College name cannot exceed 200 characters']
    }
}, {
    timestamps: true,
    toJSON: {
        transform: function (doc, ret) {
            delete ret.__v;
            return ret;
        }
    }
});
exports.userProfileSchema = userProfileSchema;
// Indexes for performance
userProfileSchema.index({ userId: 1 });
userProfileSchema.index({ email: 1 });
userProfileSchema.index({ qualification: 1 });
userProfileSchema.index({ stream: 1 });
userProfileSchema.index({ yearOfPassout: 1 });
userProfileSchema.index({ cgpaOrPercentage: 1 });
userProfileSchema.index({ collegeName: 1 });
userProfileSchema.index({ createdAt: -1 });
// Compound indexes for common queries
userProfileSchema.index({ qualification: 1, stream: 1, yearOfPassout: 1 });
userProfileSchema.index({ qualification: 1, stream: 1, cgpaOrPercentage: 1 });
// Pre-save middleware to validate custom fields
userProfileSchema.pre('save', function (next) {
    // Ensure custom fields are provided when "Others" is selected
    if (this.qualification === 'Others' && !this.customQualification) {
        return next(new Error('Custom qualification is required when "Others" is selected'));
    }
    if (this.stream === 'Others' && !this.customStream) {
        return next(new Error('Custom stream is required when "Others" is selected'));
    }
    next();
});
// Instance method to get full name
userProfileSchema.methods.getFullName = function () {
    return `${this.firstName} ${this.lastName}`;
};
// Instance method to get age
userProfileSchema.methods.getAge = function () {
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};
// Instance method to get qualification display name
userProfileSchema.methods.getQualificationDisplay = function () {
    if (this.qualification === 'Others' && this.customQualification) {
        return this.customQualification;
    }
    return this.qualification;
};
// Instance method to get stream display name
userProfileSchema.methods.getStreamDisplay = function () {
    if (this.stream === 'Others' && this.customStream) {
        return this.customStream;
    }
    return this.stream;
};
// Static method to find profiles by qualification and stream
userProfileSchema.statics.findByQualificationAndStream = function (qualification, stream) {
    return this.find({
        $or: [
            { qualification, stream },
            { qualification, customStream: stream },
            { customQualification: qualification, stream },
            { customQualification: qualification, customStream: stream }
        ]
    });
};
// Static method to find profiles by year range
userProfileSchema.statics.findByYearRange = function (startYear, endYear) {
    return this.find({
        yearOfPassout: { $gte: startYear, $lte: endYear }
    });
};
// Static method to find profiles by CGPA/Percentage range
userProfileSchema.statics.findByCGPARange = function (minValue, maxValue) {
    return this.find({
        cgpaOrPercentage: { $gte: minValue, $lte: maxValue }
    });
};
// Virtual for full name
userProfileSchema.virtual('fullName').get(function () {
    return this.getFullName();
});
// Virtual for age
userProfileSchema.virtual('age').get(function () {
    return this.getAge();
});
// Virtual for qualification display
userProfileSchema.virtual('qualificationDisplay').get(function () {
    return this.getQualificationDisplay();
});
// Virtual for stream display
userProfileSchema.virtual('streamDisplay').get(function () {
    return this.getStreamDisplay();
});
// Ensure virtuals are serialized
userProfileSchema.set('toJSON', { virtuals: true });
// Create and export the model
exports.UserProfile = mongoose_1.default.model('UserProfile', userProfileSchema);
//# sourceMappingURL=UserProfile.js.map