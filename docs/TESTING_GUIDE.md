# NotifyX Backend Testing Guide

## 🧪 Overview

This comprehensive testing guide will help you test all NotifyX backend features locally using Postman. Follow this guide step-by-step to verify that all core functionality is working correctly.

## 📋 Prerequisites

### Required Software
- **Node.js** (v16 or higher)
- **MongoDB** (running locally or MongoDB Atlas)
- **Redis** (optional, for email queue functionality)
- **Postman** (for API testing)
- **Git** (for version control)

### Required Accounts
- **Clerk Account** (for authentication)
- **Razorpay Account** (for payment testing)
- **Email Service** (Gmail, SendGrid, etc.)

## 🚀 Setup Instructions

### 1. Environment Setup

#### Clone and Install
```bash
# Clone the repository
git clone <your-repo-url>
cd X_career_backend/backend

# Install dependencies
npm install

# Copy environment template
cp .env.template .env
```

#### Configure Environment Variables
Edit your `.env` file with the following values:

```bash
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/notifyx

# Clerk Authentication (REQUIRED)
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_JWT_KEY=your_clerk_jwt_key
CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret

# Email Service (REQUIRED)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Razorpay (REQUIRED)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Redis (Optional - for email queue)
REDIS_HOST=localhost
REDIS_PORT=6379

# Server Configuration
PORT=3000
NODE_ENV=development
```

#### Start Services
```bash
# Start MongoDB (in a new terminal)
mongod

# Start Redis (optional, in a new terminal)
redis-server

# Start the backend server
npm run dev
```

### 2. Postman Setup

#### Import Collection
1. Download the Postman collection file (will be created)
2. Open Postman and click "Import"
3. Select the collection file
4. Set up environment variables

#### Environment Variables
Create a new environment in Postman with these variables:

```
BASE_URL: http://localhost:3000
API_VERSION: /api/v1
CLERK_TOKEN: (will be set during testing)
ADMIN_TOKEN: (will be set during testing)
USER_ID: (will be set during testing)
JOB_ID: (will be set during testing)
SUBSCRIPTION_ID: (will be set during testing)
```

## 🧪 Testing Sequence

### Phase 1: Authentication & User Management

#### Test 1.1: Health Check
**Endpoint**: `GET {{BASE_URL}}{{API_VERSION}}/health`

**Expected Response**:
```json
{
  "success": true,
  "message": "NotifyX API is running",
  "version": "1.0.0",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.45
}
```

**Verification**: ✅ API is running and accessible

---

#### Test 1.2: API Documentation
**Endpoint**: `GET {{BASE_URL}}{{API_VERSION}}`

**Expected Response**: Complete API endpoint listing with documentation

**Verification**: ✅ All endpoints are documented

---

#### Test 1.3: Clerk Authentication Setup
**Prerequisites**: Clerk account configured

**Steps**:
1. Go to Clerk Dashboard
2. Create a test user
3. Set user metadata: `role: "user"`
4. Get JWT token from Clerk

**Verification**: ✅ Clerk user created with proper role

---

#### Test 1.4: Get Current User
**Endpoint**: `GET {{BASE_URL}}{{API_VERSION}}/clerk-auth/me`
**Headers**: `Authorization: Bearer {{CLERK_TOKEN}}`

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "test@example.com",
      "firstName": "Test",
      "lastName": "User",
      "role": "user",
      "clerkUserId": "clerk_user_123",
      "subscriptionStatus": "inactive",
      "isProfileComplete": false
    }
  }
}
```

**Verification**: ✅ User data retrieved successfully
**Action**: Set `{{USER_ID}}` variable in Postman

---

#### Test 1.5: Update User Profile
**Endpoint**: `PUT {{BASE_URL}}{{API_VERSION}}/clerk-auth/profile`
**Headers**: `Authorization: Bearer {{CLERK_TOKEN}}`
**Body**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "location": "New York"
}
```

**Expected Response**: Profile updated successfully

**Verification**: ✅ Profile fields updated

---

#### Test 1.6: Complete User Profile
**Endpoint**: `PUT {{BASE_URL}}{{API_VERSION}}/users/profile`
**Headers**: `Authorization: Bearer {{CLERK_TOKEN}}`
**Body**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "dateOfBirth": "1995-01-01",
  "qualification": "B.Tech",
  "stream": "CSE",
  "yearOfPassout": 2023,
  "cgpaOrPercentage": 8.5,
  "collegeName": "MIT"
}
```

**Expected Response**: Profile completed successfully

**Verification**: ✅ Profile marked as complete

---

#### Test 1.7: Get Profile Completion Status
**Endpoint**: `GET {{BASE_URL}}{{API_VERSION}}/users/profile/completion`
**Headers**: `Authorization: Bearer {{CLERK_TOKEN}}`

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "isComplete": true,
    "completionPercentage": 100,
    "missingFields": []
  }
}
```

**Verification**: ✅ Profile completion verified

---

### Phase 2: Subscription & Payment Management

#### Test 2.1: Get Subscription Plans
**Endpoint**: `GET {{BASE_URL}}{{API_VERSION}}/subscriptions/plans`

**Expected Response**: List of available subscription plans

**Verification**: ✅ Plans are accessible

---

#### Test 2.2: Create Payment Order
**Endpoint**: `POST {{BASE_URL}}{{API_VERSION}}/payments/create-order`
**Headers**: `Authorization: Bearer {{CLERK_TOKEN}}`
**Body**:
```json
{
  "plan": "premium",
  "amount": 99,
  "currency": "INR"
}
```

**Expected Response**: Razorpay order created

**Verification**: ✅ Order creation successful
**Action**: Set `{{ORDER_ID}}` variable

---

#### Test 2.3: Verify Payment (Simulated)
**Note**: For testing, you can use Razorpay test mode

**Endpoint**: `POST {{BASE_URL}}{{API_VERSION}}/payments/verify`
**Headers**: `Authorization: Bearer {{CLERK_TOKEN}}`
**Body**:
```json
{
  "razorpayOrderId": "{{ORDER_ID}}",
  "razorpayPaymentId": "pay_test_123",
  "razorpaySignature": "test_signature"
}
```

**Expected Response**: Payment verified successfully

**Verification**: ✅ Payment verification working

---

#### Test 2.4: Get Subscription Status
**Endpoint**: `GET {{BASE_URL}}{{API_VERSION}}/subscriptions/status`
**Headers**: `Authorization: Bearer {{CLERK_TOKEN}}`

**Expected Response**: Active subscription details

**Verification**: ✅ Subscription status updated

---

### Phase 3: Job Management

#### Test 3.1: Create Test Job (Admin)
**Prerequisites**: Admin user with Clerk role set to "admin"

**Endpoint**: `POST {{BASE_URL}}{{API_VERSION}}/admin/jobs`
**Headers**: `Authorization: Bearer {{ADMIN_TOKEN}}`
**Body**:
```json
{
  "title": "Software Engineer",
  "company": "Tech Corp",
  "description": "We are looking for a talented software engineer...",
  "type": "job",
  "eligibility": {
    "qualifications": ["B.Tech", "M.Tech"],
    "streams": ["CSE", "IT"],
    "passoutYears": [2022, 2023, 2024],
    "minCGPA": 7.5
  },
  "applicationDeadline": "2024-02-01T00:00:00.000Z",
  "applicationLink": "https://apply.techcorp.com",
  "location": "remote",
  "salary": "₹8-12 LPA"
}
```

**Expected Response**: Job created successfully

**Verification**: ✅ Job creation working
**Action**: Set `{{JOB_ID}}` variable

---

#### Test 3.2: Get All Jobs (User View)
**Endpoint**: `GET {{BASE_URL}}{{API_VERSION}}/jobs?limit=10`
**Headers**: `Authorization: Bearer {{CLERK_TOKEN}}`

**Expected Response**: List of available jobs

**Verification**: ✅ Jobs are accessible to users

---

#### Test 3.3: Get Job by ID
**Endpoint**: `GET {{BASE_URL}}{{API_VERSION}}/jobs/{{JOB_ID}}`
**Headers**: `Authorization: Bearer {{CLERK_TOKEN}}`

**Expected Response**: Detailed job information

**Verification**: ✅ Job details retrieved

---

#### Test 3.4: Apply for Job
**Endpoint**: `POST {{BASE_URL}}{{API_VERSION}}/job-applications`
**Headers**: `Authorization: Bearer {{CLERK_TOKEN}}`
**Body**:
```json
{
  "jobId": "{{JOB_ID}}",
  "coverLetter": "I am very interested in this position...",
  "resume": "base64_encoded_resume_content"
}
```

**Expected Response**: Application submitted successfully

**Verification**: ✅ Job application working

---

#### Test 3.5: Get User Applications
**Endpoint**: `GET {{BASE_URL}}{{API_VERSION}}/job-applications`
**Headers**: `Authorization: Bearer {{CLERK_TOKEN}}`

**Expected Response**: List of user's applications

**Verification**: ✅ Applications are retrievable

---

### Phase 4: Job Matching Algorithm

#### Test 4.1: Get Job Recommendations
**Endpoint**: `GET {{BASE_URL}}{{API_VERSION}}/job-matching/recommendations?limit=5`
**Headers**: `Authorization: Bearer {{CLERK_TOKEN}}`

**Expected Response**: Personalized job recommendations

**Verification**: ✅ Matching algorithm working

---

#### Test 4.2: Get Matching Analytics
**Endpoint**: `GET {{BASE_URL}}{{API_VERSION}}/job-matching/analytics`
**Headers**: `Authorization: Bearer {{CLERK_TOKEN}}`

**Expected Response**: Matching statistics and insights

**Verification**: ✅ Analytics data available

---

### Phase 5: Email Notification System

#### Test 5.1: Test Email Connection
**Endpoint**: `POST {{BASE_URL}}{{API_VERSION}}/notifications/test-connection`
**Headers**: `Authorization: Bearer {{ADMIN_TOKEN}}`

**Expected Response**: Email service connection test

**Verification**: ✅ Email service working

---

#### Test 5.2: Send Welcome Email
**Endpoint**: `POST {{BASE_URL}}{{API_VERSION}}/notifications/welcome`
**Headers**: `Authorization: Bearer {{ADMIN_TOKEN}}`
**Body**:
```json
{
  "userId": "{{USER_ID}}",
  "template": "welcome",
  "context": {
    "firstName": "John",
    "plan": "premium"
  }
}
```

**Expected Response**: Welcome email sent

**Verification**: ✅ Email sent successfully

---

#### Test 5.3: Send Job Alert Email
**Endpoint**: `POST {{BASE_URL}}{{API_VERSION}}/notifications/job-alert`
**Headers**: `Authorization: Bearer {{ADMIN_TOKEN}}`
**Body**:
```json
{
  "userId": "{{USER_ID}}",
  "jobId": "{{JOB_ID}}",
  "template": "job-alert"
}
```

**Expected Response**: Job alert email sent

**Verification**: ✅ Job alert working

---

#### Test 5.4: Get Email Queue Status
**Endpoint**: `GET {{BASE_URL}}{{API_VERSION}}/notifications/queue-status`
**Headers**: `Authorization: Bearer {{ADMIN_TOKEN}}`

**Expected Response**: Email queue statistics

**Verification**: ✅ Queue monitoring working

---

### Phase 6: Admin Dashboard

#### Test 6.1: Get Dashboard Statistics
**Endpoint**: `GET {{BASE_URL}}{{API_VERSION}}/admin/dashboard/stats`
**Headers**: `Authorization: Bearer {{ADMIN_TOKEN}}`

**Expected Response**: Comprehensive dashboard statistics

**Verification**: ✅ Dashboard data accessible

---

#### Test 6.2: Get User Analytics
**Endpoint**: `GET {{BASE_URL}}{{API_VERSION}}/admin/dashboard/user-analytics?period=30d`
**Headers**: `Authorization: Bearer {{ADMIN_TOKEN}}`

**Expected Response**: User analytics and metrics

**Verification**: ✅ Analytics working

---

#### Test 6.3: Get Job Analytics
**Endpoint**: `GET {{BASE_URL}}{{API_VERSION}}/admin/dashboard/job-analytics`
**Headers**: `Authorization: Bearer {{ADMIN_TOKEN}}`

**Expected Response**: Job performance analytics

**Verification**: ✅ Job analytics working

---

#### Test 6.4: Get System Health
**Endpoint**: `GET {{BASE_URL}}{{API_VERSION}}/admin/dashboard/system-health`
**Headers**: `Authorization: Bearer {{ADMIN_TOKEN}}`

**Expected Response**: System health metrics

**Verification**: ✅ System monitoring working

---

#### Test 6.5: Admin User Management
**Endpoint**: `GET {{BASE_URL}}{{API_VERSION}}/admin/users?limit=10`
**Headers**: `Authorization: Bearer {{ADMIN_TOKEN}}`

**Expected Response**: List of all users

**Verification**: ✅ User management accessible

---

#### Test 6.6: Admin Job Management
**Endpoint**: `GET {{BASE_URL}}{{API_VERSION}}/admin/jobs?limit=10`
**Headers**: `Authorization: Bearer {{ADMIN_TOKEN}}`

**Expected Response**: List of all jobs

**Verification**: ✅ Job management accessible

---

#### Test 6.7: Get Moderation Queue
**Endpoint**: `GET {{BASE_URL}}{{API_VERSION}}/admin/jobs/moderation/queue`
**Headers**: `Authorization: Bearer {{ADMIN_TOKEN}}`

**Expected Response**: Jobs pending moderation

**Verification**: ✅ Moderation system working

---

#### Test 6.8: Audit Logs
**Endpoint**: `GET {{BASE_URL}}{{API_VERSION}}/admin/audit-logs?limit=20`
**Headers**: `Authorization: Bearer {{ADMIN_TOKEN}}`

**Expected Response**: Admin action logs

**Verification**: ✅ Audit logging working

---

#### Test 6.9: Export Audit Logs
**Endpoint**: `GET {{BASE_URL}}{{API_VERSION}}/admin/audit-logs/export`
**Headers**: `Authorization: Bearer {{ADMIN_TOKEN}}`

**Expected Response**: CSV file download

**Verification**: ✅ Export functionality working

---

### Phase 7: Bulk Operations

#### Test 7.1: Bulk Update Users
**Endpoint**: `POST {{BASE_URL}}{{API_VERSION}}/admin/users/bulk-update`
**Headers**: `Authorization: Bearer {{ADMIN_TOKEN}}`
**Body**:
```json
{
  "userIds": ["{{USER_ID}}"],
  "updates": {
    "isActive": true
  }
}
```

**Expected Response**: Bulk update successful

**Verification**: ✅ Bulk operations working

---

#### Test 7.2: Bulk Update Jobs
**Endpoint**: `POST {{BASE_URL}}{{API_VERSION}}/admin/jobs/bulk-update`
**Headers**: `Authorization: Bearer {{ADMIN_TOKEN}}`
**Body**:
```json
{
  "jobIds": ["{{JOB_ID}}"],
  "updates": {
    "isActive": true
  }
}
```

**Expected Response**: Bulk update successful

**Verification**: ✅ Job bulk operations working

---

## 🔍 Verification Checklist

### Core Functionality ✅
- [ ] User authentication and profile management
- [ ] Subscription plans and payment processing
- [ ] Job posting and management
- [ ] Job matching algorithm
- [ ] Email notification system
- [ ] Admin dashboard and analytics
- [ ] Audit logging and export
- [ ] Bulk operations

### Security Features ✅
- [ ] Role-based access control
- [ ] Input validation
- [ ] Authentication middleware
- [ ] Admin-only endpoints protected

### Data Integrity ✅
- [ ] User profiles complete and accurate
- [ ] Job data properly stored
- [ ] Subscription status tracking
- [ ] Application data integrity

### Performance ✅
- [ ] API response times < 500ms
- [ ] Database queries optimized
- [ ] Pagination working correctly
- [ ] Search and filtering functional

## 🚨 Common Issues & Solutions

### Issue 1: Clerk Authentication Fails
**Symptoms**: 401 Unauthorized errors
**Solutions**:
- Verify Clerk environment variables
- Check JWT token validity
- Ensure user role is set in Clerk metadata

### Issue 2: MongoDB Connection Fails
**Symptoms**: 500 Internal Server Error
**Solutions**:
- Verify MongoDB is running
- Check connection string in .env
- Ensure database exists

### Issue 3: Email Service Fails
**Symptoms**: Email endpoints return errors
**Solutions**:
- Verify email credentials
- Check SMTP settings
- Test with Gmail app password

### Issue 4: Razorpay Integration Issues
**Symptoms**: Payment endpoints fail
**Solutions**:
- Verify Razorpay credentials
- Use test mode for development
- Check webhook configuration

### Issue 5: Admin Access Denied
**Symptoms**: 403 Forbidden on admin endpoints
**Solutions**:
- Verify user role is "admin" or "super_admin"
- Check Clerk metadata
- Ensure proper token is used

## 📊 Performance Testing

### Load Testing
```bash
# Install artillery for load testing
npm install -g artillery

# Run basic load test
artillery run load-test.yml
```

### Database Performance
- Monitor MongoDB query performance
- Check index usage
- Verify connection pooling

### API Response Times
- Monitor average response times
- Check for slow endpoints
- Verify caching implementation

## 🧹 Cleanup & Maintenance

### Test Data Cleanup
```bash
# Clear test data from MongoDB
mongo notifyx --eval "db.users.deleteMany({email: /test/})"
mongo notifyx --eval "db.jobs.deleteMany({title: /Test/})"
```

### Log Rotation
- Monitor log file sizes
- Implement log rotation
- Archive old logs

### Database Maintenance
- Regular database backups
- Index optimization
- Data cleanup scripts

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

Core Features Working: Yes/No
Security Features Working: Yes/No
Performance Acceptable: Yes/No
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

**Happy Testing! 🚀**

This guide ensures comprehensive testing of all NotifyX backend features. Follow each phase systematically to verify functionality before deployment.
