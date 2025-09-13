# NotifyX Admin Testing Guide

## 🎯 Overview

This comprehensive guide will help you test all admin functionality in the NotifyX backend system. The guide covers testing of admin authentication, dashboard analytics, user management, job management, subscription management, and audit logging.

## 📋 Prerequisites

### Required Software
- **Node.js** (v16 or higher)
- **MongoDB** (running locally or MongoDB Atlas)
- **Postman** (for API testing)
- **Git** (for version control)

### Required Setup
- Backend server running on `http://localhost:3000`
- Database seeded with test data
- Admin accounts created

## 🚀 Quick Start Testing

### 1. Seed the Database with Test Data

First, populate your database with comprehensive test data:

```bash
cd backend
npm run seed:test-data
```

This will create:
- **3 Admin Users** (Super Admin, Admin, Moderator)
- **5 Regular Users** with complete profiles
- **5 Jobs** (mix of jobs and internships)
- **4 Subscriptions** (active, expired, different plans)
- **3 Job Applications** (different statuses)
- **2 Job Notifications**

### 2. Run Automated Admin Tests

Execute the comprehensive admin functionality test suite:

```bash
cd backend
npm run test:admin
```

This will test all admin endpoints and provide detailed results.

## 🔐 Admin Authentication Testing

### Admin Login Credentials

| Role | Email | Password | Permissions |
|------|-------|----------|-------------|
| **Super Admin** | `superadmin@notifyx.com` | `SuperAdmin123!` | All permissions |
| **Admin** | `admin@notifyx.com` | `Admin123!` | Most permissions |
| **Moderator** | `moderator@notifyx.com` | `Moderator123!` | Limited permissions |

### Test Admin Login

**Endpoint**: `POST /api/v1/admin/login`

**Test Cases**:

1. **Valid Super Admin Login**
   ```json
   {
     "email": "superadmin@notifyx.com",
     "password": "SuperAdmin123!"
   }
   ```
   **Expected**: 200 OK with JWT token

2. **Valid Admin Login**
   ```json
   {
     "email": "admin@notifyx.com",
     "password": "Admin123!"
   }
   ```
   **Expected**: 200 OK with JWT token

3. **Valid Moderator Login**
   ```json
   {
     "email": "moderator@notifyx.com",
     "password": "Moderator123!"
   }
   ```
   **Expected**: 200 OK with JWT token

4. **Invalid Credentials**
   ```json
   {
     "email": "admin@notifyx.com",
     "password": "wrongpassword"
   }
   ```
   **Expected**: 401 Unauthorized

5. **Non-existent User**
   ```json
   {
     "email": "nonexistent@example.com",
     "password": "password123"
   }
   ```
   **Expected**: 401 Unauthorized

## 📊 Admin Dashboard Testing

### 1. Dashboard Statistics

**Endpoint**: `GET /api/v1/admin/dashboard/stats`
**Required**: Admin authentication

**Test Cases**:

1. **Get Dashboard Stats (Super Admin)**
   - **Headers**: `Authorization: Bearer {super_admin_token}`
   - **Expected Response**:
     ```json
     {
       "success": true,
       "data": {
         "overview": {
           "totalUsers": 5,
           "activeUsers": 3,
           "totalJobs": 5,
           "activeJobs": 5,
           "totalSubscriptions": 4,
           "activeSubscriptions": 3,
           "totalApplications": 3,
           "pendingApplications": 1
         },
         "monthlyGrowth": {
           "newUsers": 5,
           "newJobs": 5,
           "newSubscriptions": 4
         },
         "distributions": {
           "subscriptionPlans": [...],
           "userRoles": [...],
           "jobTypes": [...]
         }
       }
     }
     ```

2. **Get Dashboard Stats (Regular Admin)**
   - **Headers**: `Authorization: Bearer {admin_token}`
   - **Expected**: Same response as super admin

3. **Get Dashboard Stats (Moderator)**
   - **Headers**: `Authorization: Bearer {moderator_token}`
   - **Expected**: 403 Forbidden (insufficient permissions)

4. **Unauthenticated Request**
   - **Headers**: None
   - **Expected**: 401 Unauthorized

### 2. User Analytics

**Endpoint**: `GET /api/v1/admin/dashboard/user-analytics?period=30d`
**Required**: Admin authentication

**Test Cases**:

1. **Get User Analytics (30 days)**
   - **Query**: `?period=30d`
   - **Expected**: User registration trends, subscription analytics, profile completion stats

2. **Get User Analytics (7 days)**
   - **Query**: `?period=7d`
   - **Expected**: Shorter time period data

3. **Get User Analytics (90 days)**
   - **Query**: `?period=90d`
   - **Expected**: Longer time period data

4. **Invalid Period Parameter**
   - **Query**: `?period=invalid`
   - **Expected**: Defaults to 30 days

### 3. Job Analytics

**Endpoint**: `GET /api/v1/admin/dashboard/job-analytics`
**Required**: Admin authentication

**Test Cases**:

1. **Get Job Analytics**
   - **Expected**: Job statistics, type distribution, location distribution, top performing jobs

2. **Verify Job Counts**
   - **Expected**: Total jobs: 5, Active jobs: 5, Total applications: 3

### 4. System Health

**Endpoint**: `GET /api/v1/admin/dashboard/system-health`
**Required**: Admin authentication

**Test Cases**:

1. **Get System Health**
   - **Expected**: Database stats, recent activity, system uptime, memory usage

2. **Verify Database Connectivity**
   - **Expected**: All collections showing correct counts

## 👥 User Management Testing

### 1. Get All Users

**Endpoint**: `GET /api/v1/admin/users?limit=10&page=1`
**Required**: Admin authentication

**Test Cases**:

1. **Get Users with Pagination**
   - **Query**: `?limit=10&page=1`
   - **Expected**: List of users with pagination metadata

2. **Get Users with Role Filter**
   - **Query**: `?role=user`
   - **Expected**: Only users with role "user"

3. **Get Users with Subscription Filter**
   - **Query**: `?subscriptionStatus=active`
   - **Expected**: Only users with active subscriptions

4. **Get Users with Profile Completion Filter**
   - **Query**: `?isProfileComplete=true`
   - **Expected**: Only users with complete profiles

### 2. Get User by ID

**Endpoint**: `GET /api/v1/admin/users/{userId}`
**Required**: Admin authentication

**Test Cases**:

1. **Get Valid User**
   - **Expected**: Complete user details with profile information

2. **Get Invalid User ID**
   - **Expected**: 400 Bad Request with validation error

3. **Get Non-existent User**
   - **Expected**: 404 Not Found

### 3. Update User Role

**Endpoint**: `PUT /api/v1/admin/users/{userId}`
**Required**: Admin authentication

**Test Cases**:

1. **Update User Role to Admin**
   ```json
   {
     "role": "admin",
     "isActive": true
   }
   ```
   - **Expected**: 200 OK with updated user data

2. **Update User Role to Super Admin**
   ```json
   {
     "role": "super_admin"
   }
   ```
   - **Expected**: 403 Forbidden (requires super admin)

3. **Update with Invalid Role**
   ```json
   {
     "role": "invalid_role"
   }
   ```
   - **Expected**: 400 Bad Request with validation error

### 4. Bulk Update Users

**Endpoint**: `POST /api/v1/admin/users/bulk-update`
**Required**: Super Admin authentication

**Test Cases**:

1. **Bulk Update User Status**
   ```json
   {
     "userIds": ["user1", "user2"],
     "updates": {
       "isActive": true
     }
   }
   ```
   - **Expected**: 200 OK with update results

2. **Bulk Update with Invalid IDs**
   ```json
   {
     "userIds": ["invalid_id"],
     "updates": {
       "isActive": false
     }
   }
   ```
   - **Expected**: 400 Bad Request with validation errors

### 5. Get User Activity

**Endpoint**: `GET /api/v1/admin/users/{userId}/activity`
**Required**: Admin authentication

**Test Cases**:

1. **Get User Activity**
   - **Expected**: User engagement metrics, job applications, login history

## 💼 Job Management Testing

### 1. Get All Jobs

**Endpoint**: `GET /api/v1/admin/jobs?limit=10&page=1`
**Required**: Admin authentication

**Test Cases**:

1. **Get Jobs with Pagination**
   - **Expected**: List of jobs with pagination metadata

2. **Get Jobs by Type**
   - **Query**: `?type=job`
   - **Expected**: Only full-time jobs

3. **Get Jobs by Location**
   - **Query**: `?location=remote`
   - **Expected**: Only remote jobs

4. **Get Jobs by Status**
   - **Query**: `?status=approved`
   - **Expected**: Only approved jobs

### 2. Get Job by ID

**Endpoint**: `GET /api/v1/admin/jobs/{jobId}`
**Required**: Admin authentication

**Test Cases**:

1. **Get Valid Job**
   - **Expected**: Complete job details with applications

2. **Get Invalid Job ID**
   - **Expected**: 400 Bad Request with validation error

### 3. Update Job Status

**Endpoint**: `PUT /api/v1/admin/jobs/{jobId}`
**Required**: Admin authentication

**Test Cases**:

1. **Approve Job**
   ```json
   {
     "status": "approved",
     "isActive": true,
     "moderationNotes": "Job approved after review"
   }
   ```
   - **Expected**: 200 OK with updated job data

2. **Reject Job**
   ```json
   {
     "status": "rejected",
     "isActive": false,
     "moderationNotes": "Job rejected due to incomplete information"
   }
   ```
   - **Expected**: 200 OK with updated job data

3. **Feature Job**
   ```json
   {
     "isFeatured": true
   }
   ```
   - **Expected**: 200 OK with featured job

### 4. Get Moderation Queue

**Endpoint**: `GET /api/v1/admin/jobs/moderation/queue`
**Required**: Admin authentication

**Test Cases**:

1. **Get Moderation Queue**
   - **Expected**: Jobs pending approval/rejection

### 5. Get Job Application Analytics

**Endpoint**: `GET /api/v1/admin/jobs/{jobId}/applications/analytics`
**Required**: Admin authentication

**Test Cases**:

1. **Get Job Application Analytics**
   - **Expected**: Application statistics, status distribution, timeline

### 6. Bulk Update Jobs

**Endpoint**: `POST /api/v1/admin/jobs/bulk-update`
**Required**: Admin authentication

**Test Cases**:

1. **Bulk Approve Jobs**
   ```json
   {
     "jobIds": ["job1", "job2"],
     "updates": {
       "status": "approved",
       "isActive": true
     }
   }
   ```
   - **Expected**: 200 OK with update results

## 💳 Subscription Management Testing

### 1. Get All Subscriptions

**Endpoint**: `GET /api/v1/admin/subscriptions?limit=10&page=1`
**Required**: Admin authentication

**Test Cases**:

1. **Get Subscriptions with Pagination**
   - **Expected**: List of subscriptions with pagination metadata

2. **Get Subscriptions by Status**
   - **Query**: `?status=active`
   - **Expected**: Only active subscriptions

3. **Get Subscriptions by Plan**
   - **Query**: `?plan=premium`
   - **Expected**: Only premium subscriptions

### 2. Get Subscription by ID

**Endpoint**: `GET /api/v1/admin/subscriptions/{subscriptionId}`
**Required**: Admin authentication

**Test Cases**:

1. **Get Valid Subscription**
   - **Expected**: Complete subscription details

### 3. Update Subscription

**Endpoint**: `PUT /api/v1/admin/subscriptions/{subscriptionId}`
**Required**: Admin authentication

**Test Cases**:

1. **Update Subscription Status**
   ```json
   {
     "status": "active",
     "isActive": true,
     "adminNotes": "Subscription reactivated by admin"
   }
   ```
   - **Expected**: 200 OK with updated subscription

2. **Update Subscription Plan**
   ```json
   {
     "plan": "premium",
     "amount": 999
   }
   ```
   - **Expected**: 200 OK with updated subscription

### 4. Cancel Subscription

**Endpoint**: `POST /api/v1/admin/subscriptions/{subscriptionId}/cancel`
**Required**: Admin authentication

**Test Cases**:

1. **Cancel Subscription**
   ```json
   {
     "reason": "User requested cancellation",
     "refundAmount": 500
   }
   ```
   - **Expected**: 200 OK with cancellation details

### 5. Get Subscription Analytics

**Endpoint**: `GET /api/v1/admin/subscriptions/analytics`
**Required**: Admin authentication

**Test Cases**:

1. **Get Subscription Analytics**
   - **Expected**: Revenue metrics, plan distribution, churn analysis

### 6. Bulk Update Subscriptions

**Endpoint**: `POST /api/v1/admin/subscriptions/bulk-update`
**Required**: Admin authentication

**Test Cases**:

1. **Bulk Update Subscription Status**
   ```json
   {
     "subscriptionIds": ["sub1", "sub2"],
     "updates": {
       "isActive": true
     }
   }
   ```
   - **Expected**: 200 OK with update results

## 📝 Audit Log Testing

### 1. Get Audit Logs

**Endpoint**: `GET /api/v1/admin/audit-logs?limit=20&page=1`
**Required**: Admin authentication

**Test Cases**:

1. **Get Audit Logs with Pagination**
   - **Expected**: List of audit logs with pagination metadata

2. **Get Audit Logs by Action**
   - **Query**: `?action=user_update`
   - **Expected**: Only user update actions

3. **Get Audit Logs by Admin**
   - **Query**: `?adminId=admin1`
   - **Expected**: Only actions by specific admin

### 2. Get Recent Activity

**Endpoint**: `GET /api/v1/admin/audit-logs/recent`
**Required**: Admin authentication

**Test Cases**:

1. **Get Recent Activity**
   - **Expected**: Recent admin actions and system events

### 3. Get Admin Activity

**Endpoint**: `GET /api/v1/admin/audit-logs/admin/{targetAdminId}`
**Required**: Admin authentication

**Test Cases**:

1. **Get Specific Admin Activity**
   - **Expected**: All actions performed by specific admin

### 4. Get Resource Activity

**Endpoint**: `GET /api/v1/admin/audit-logs/resource/{resourceType}/{resourceId}`
**Required**: Admin authentication

**Test Cases**:

1. **Get User Resource Activity**
   - **Path**: `/resource/user/user123`
   - **Expected**: All actions on specific user

2. **Get Job Resource Activity**
   - **Path**: `/resource/job/job123`
   - **Expected**: All actions on specific job

### 5. Export Audit Logs

**Endpoint**: `GET /api/v1/admin/audit-logs/export`
**Required**: Admin authentication

**Test Cases**:

1. **Export Audit Logs (CSV)**
   - **Expected**: CSV file download with all audit logs

## 🔒 Role-Based Access Control Testing

### 1. Super Admin Permissions

**Test Cases**:

1. **Access All Endpoints**
   - **Expected**: Full access to all admin functionality

2. **Manage Other Admins**
   - **Expected**: Can create, update, delete admin accounts

3. **System Settings**
   - **Expected**: Can modify system configuration

### 2. Regular Admin Permissions

**Test Cases**:

1. **User Management**
   - **Expected**: Can manage users, view analytics

2. **Job Management**
   - **Expected**: Can moderate jobs, view job analytics

3. **Subscription Management**
   - **Expected**: Can manage subscriptions, view analytics

4. **Restricted Operations**
   - **Expected**: Cannot manage other admins or system settings

### 3. Moderator Permissions

**Test Cases**:

1. **Job Management Only**
   - **Expected**: Can only access job-related endpoints

2. **Restricted Access**
   - **Expected**: Cannot access user management, subscription management

## 🧪 Automated Testing

### Run Complete Test Suite

```bash
cd backend
npm run test:admin
```

### Test Individual Components

```bash
# Test admin authentication only
npm run test:admin:auth

# Test dashboard functionality only
npm run test:admin:dashboard

# Test user management only
npm run test:admin:users

# Test job management only
npm run test:admin:jobs

# Test subscription management only
npm run test:admin:subscriptions

# Test audit logs only
npm run test:admin:audit
```

## 📊 Test Data Verification

### Verify Seeded Data

After running the seed script, verify these counts:

```bash
# Connect to MongoDB
mongo notifyx

# Check collections
db.admins.countDocuments()        # Should be 3
db.users.countDocuments()         # Should be 5
db.userprofiles.countDocuments()  # Should be 5
db.jobs.countDocuments()          # Should be 5
db.subscriptions.countDocuments() # Should be 4
db.jobapplications.countDocuments() # Should be 3
db.jobnotifications.countDocuments() # Should be 2
```

### Verify Admin Accounts

```javascript
// Check admin accounts
db.admins.find({}, {email: 1, role: 1, permissions: 1})

// Expected output:
// - superadmin@notifyx.com (super_admin) - all permissions
// - admin@notifyx.com (admin) - most permissions
// - moderator@notifyx.com (admin) - limited permissions
```

## 🚨 Common Issues & Solutions

### Issue 1: Authentication Fails

**Symptoms**: 401 Unauthorized on all admin endpoints
**Solutions**:
- Verify admin accounts exist in database
- Check password hashing is working
- Ensure JWT tokens are valid

### Issue 2: Permission Denied

**Symptoms**: 403 Forbidden on certain endpoints
**Solutions**:
- Check user role and permissions
- Verify middleware is working correctly
- Ensure proper role hierarchy

### Issue 3: Database Connection Issues

**Symptoms**: 500 Internal Server Error
**Solutions**:
- Verify MongoDB is running
- Check connection string
- Ensure database exists

### Issue 4: Validation Errors

**Symptoms**: 400 Bad Request with validation messages
**Solutions**:
- Check request body format
- Verify required fields
- Ensure data types are correct

## 📝 Test Report Template

### Test Summary

```
Date: _______________
Tester: _____________
Environment: _________

Total Tests: ___
Passed: ___
Failed: ___
Skipped: ___

Admin Authentication: ✅/❌
Dashboard Analytics: ✅/❌
User Management: ✅/❌
Job Management: ✅/❌
Subscription Management: ✅/❌
Audit Logging: ✅/❌
Role-Based Access: ✅/❌
```

### Issues Found

```
1. Issue Description
   - Severity: High/Medium/Low
   - Steps to Reproduce:
   - Expected vs Actual:
   - Status: Open/Fixed/Verified

2. Issue Description
   ...
```

### Recommendations

```
1. Performance improvements needed
2. Additional security measures
3. Feature enhancements
4. Documentation updates
```

## 🎯 Next Steps

After completing all tests:

1. **Fix any issues** found during testing
2. **Optimize performance** based on test results
3. **Update documentation** with any changes
4. **Prepare for deployment** to staging/production
5. **Set up monitoring** and alerting
6. **Plan user acceptance testing**

## 🤝 Support

For testing support:
- Check application logs
- Review error responses
- Consult API documentation
- Contact development team
- Submit issues through repository

---

**Happy Admin Testing! 🚀**

This guide ensures comprehensive testing of all NotifyX admin functionality. Follow each section systematically to verify admin features before deployment.




