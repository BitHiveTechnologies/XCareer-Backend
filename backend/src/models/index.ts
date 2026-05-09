// Export all models
export { User, userSchema } from './User';
export { UserProfile, userProfileSchema } from './UserProfile';
export { Job, jobSchema } from './Job';
export { JobApplication } from './JobApplication';
export { Admin, adminSchema } from './Admin';
export { Subscription, subscriptionSchema } from './Subscription';
export { JobNotification, jobNotificationSchema } from './JobNotification';

// Export all interfaces
export * from './interfaces';

// Export model names for reference
export const MODEL_NAMES = {
  USER: 'User',
  USER_PROFILE: 'UserProfile',
  JOB: 'Job',
  JOB_APPLICATION: 'JobApplication',
  ADMIN: 'Admin',
  SUBSCRIPTION: 'Subscription',
  JOB_NOTIFICATION: 'JobNotification'
} as const;

// Export collection names for reference
export const COLLECTION_NAMES = {
  USERS: 'users',
  USER_PROFILES: 'userprofiles',
  JOBS: 'jobs',
  JOB_APPLICATIONS: 'jobapplications',
  ADMINS: 'admins',
  SUBSCRIPTIONS: 'subscriptions',
  JOB_NOTIFICATIONS: 'jobnotifications'
} as const;
