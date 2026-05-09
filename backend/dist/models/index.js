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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.COLLECTION_NAMES = exports.MODEL_NAMES = exports.jobNotificationSchema = exports.JobNotification = exports.subscriptionSchema = exports.Subscription = exports.adminSchema = exports.Admin = exports.JobApplication = exports.jobSchema = exports.Job = exports.userProfileSchema = exports.UserProfile = exports.userSchema = exports.User = void 0;
// Export all models
var User_1 = require("./User");
Object.defineProperty(exports, "User", { enumerable: true, get: function () { return User_1.User; } });
Object.defineProperty(exports, "userSchema", { enumerable: true, get: function () { return User_1.userSchema; } });
var UserProfile_1 = require("./UserProfile");
Object.defineProperty(exports, "UserProfile", { enumerable: true, get: function () { return UserProfile_1.UserProfile; } });
Object.defineProperty(exports, "userProfileSchema", { enumerable: true, get: function () { return UserProfile_1.userProfileSchema; } });
var Job_1 = require("./Job");
Object.defineProperty(exports, "Job", { enumerable: true, get: function () { return Job_1.Job; } });
Object.defineProperty(exports, "jobSchema", { enumerable: true, get: function () { return Job_1.jobSchema; } });
var JobApplication_1 = require("./JobApplication");
Object.defineProperty(exports, "JobApplication", { enumerable: true, get: function () { return JobApplication_1.JobApplication; } });
var Admin_1 = require("./Admin");
Object.defineProperty(exports, "Admin", { enumerable: true, get: function () { return Admin_1.Admin; } });
Object.defineProperty(exports, "adminSchema", { enumerable: true, get: function () { return Admin_1.adminSchema; } });
var Subscription_1 = require("./Subscription");
Object.defineProperty(exports, "Subscription", { enumerable: true, get: function () { return Subscription_1.Subscription; } });
Object.defineProperty(exports, "subscriptionSchema", { enumerable: true, get: function () { return Subscription_1.subscriptionSchema; } });
var JobNotification_1 = require("./JobNotification");
Object.defineProperty(exports, "JobNotification", { enumerable: true, get: function () { return JobNotification_1.JobNotification; } });
Object.defineProperty(exports, "jobNotificationSchema", { enumerable: true, get: function () { return JobNotification_1.jobNotificationSchema; } });
// Export all interfaces
__exportStar(require("./interfaces"), exports);
// Export model names for reference
exports.MODEL_NAMES = {
    USER: 'User',
    USER_PROFILE: 'UserProfile',
    JOB: 'Job',
    JOB_APPLICATION: 'JobApplication',
    ADMIN: 'Admin',
    SUBSCRIPTION: 'Subscription',
    JOB_NOTIFICATION: 'JobNotification'
};
// Export collection names for reference
exports.COLLECTION_NAMES = {
    USERS: 'users',
    USER_PROFILES: 'userprofiles',
    JOBS: 'jobs',
    JOB_APPLICATIONS: 'jobapplications',
    ADMINS: 'admins',
    SUBSCRIPTIONS: 'subscriptions',
    JOB_NOTIFICATIONS: 'jobnotifications'
};
//# sourceMappingURL=index.js.map