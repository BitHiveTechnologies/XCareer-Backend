# 🧪 NotifyX Backend - Comprehensive Testing Guide

## 🚀 Quick Start

### Option 1: Automated Testing (Recommended)
```bash
cd backend
npm run test:comprehensive
```

### Option 2: Manual Step-by-Step
```bash
cd backend

# 1. Seed test data
npx ts-node scripts/seedTestData.ts

# 2. Run comprehensive tests
npx ts-node scripts/comprehensiveApiTest.ts
```

## 🔧 Authentication Systems

Your backend has **TWO authentication systems**:

### 1. **Legacy JWT System** (`/api/v1/auth/*`)
- **Registration**: `POST /api/v1/auth/register`
- **Login**: `POST /api/v1/auth/login`
- **Token**: JWT token in `Authorization: Bearer <token>` header

### 2. **Clerk System** (`/api/v1/clerk-auth/*`)
- **Frontend Integration**: Requires Clerk frontend
- **Token**: Clerk session token in `Authorization: Bearer <clerk-token>` header

## 📋 Test Data

After running the seed script, you'll have:

### Admin Users (JWT)
- **Super Admin**: `superadmin@notifyx.com` / `SuperAdmin123!`
- **Admin**: `admin@notifyx.com` / `Admin123!`
- **Moderator**: `moderator@notifyx.com` / `Moderator123!`

### Regular Users (JWT)
- **Test User**: `testuser@example.com` / `TestPassword123!`
- **Sample Users**: `john.doe@example.com`, `jane.smith@example.com`, etc.

## 🧪 Complete API Endpoints Testing

### 1. Health Check & System Status

#### 1.1 Health Check
- **GET** `/health`
- **Description**: Check if the API is running
- **Authentication**: None required
- **Expected Response**: 200 OK with server status

```bash
curl -X GET http://localhost:3000/health
```

#### 1.2 API Documentation
- **GET** `/api/v1`
- **Description**: Get API documentation and available endpoints
- **Authentication**: None required
- **Expected Response**: 200 OK with endpoint listing

```bash
curl -X GET http://localhost:3000/api/v1
```

### 2. Authentication (JWT System)

#### 2.1 User Registration
- **POST** `/api/v1/auth/register`
- **Description**: Register a new user
- **Authentication**: None required
- **Body**:
```json
{
  "name": "Test User",
  "email": "testuser@example.com",
  "password": "TestPassword123!",
  "mobile": "9876543210",
  "qualification": "B.Tech",
  "stream": "CSE",
  "yearOfPassout": 2023,
  "cgpaOrPercentage": 8.5
}
```

#### 2.2 User Login
- **POST** `/api/v1/auth/login`
- **Description**: Login user and get JWT token
- **Authentication**: None required
- **Body**:
```json
{
  "email": "testuser@example.com",
  "password": "TestPassword123!"
}
```

#### 2.3 Get Current User
- **GET** `/api/v1/auth/me`
- **Description**: Get current user profile
- **Authentication**: JWT token required
- **Headers**: `Authorization: Bearer <jwt_token>`

#### 2.4 Refresh Token
- **POST** `/api/v1/auth/refresh`
- **Description**: Refresh access token
- **Authentication**: None required
- **Body**:
```json
{
  "refreshToken": "your_refresh_token_here"
}
```

#### 2.5 Change Password
- **POST** `/api/v1/auth/change-password`
- **Description**: Change user password
- **Authentication**: JWT token required
- **Body**:
```json
{
  "currentPassword": "TestPassword123!",
  "newPassword": "NewPassword123!"
}
```

#### 2.6 User Logout
- **POST** `/api/v1/auth/logout`
- **Description**: Logout user
- **Authentication**: JWT token required

### 3. Authentication (Clerk System)

#### 3.1 Get Current User (Clerk)
- **GET** `/api/v1/clerk-auth/me`
- **Description**: Get current user profile via Clerk
- **Authentication**: Clerk token required
- **Headers**: `Authorization: Bearer <clerk_token>`

#### 3.2 Update Profile (Clerk)
- **PUT** `/api/v1/clerk-auth/profile`
- **Description**: Update user profile via Clerk
- **Authentication**: Clerk token required
- **Body**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "location": "New York"
}
```

#### 3.3 Clerk Webhook
- **POST** `/api/v1/clerk-auth/webhook`
- **Description**: Handle Clerk webhook events
- **Authentication**: Webhook signature verification

### 4. User Management

#### 4.1 Get User Profile
- **GET** `/api/v1/users/profile`
- **Description**: Get user profile details
- **Authentication**: JWT token required

#### 4.2 Update User Profile
- **PUT** `/api/v1/users/profile`
- **Description**: Update user profile
- **Authentication**: JWT token required
- **Body**:
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

#### 4.3 Get Profile Completion Status
- **GET** `/api/v1/users/profile/completion`
- **Description**: Check profile completion status
- **Authentication**: JWT token required

### 5. Job Management

#### 5.1 Get All Jobs (Public)
- **GET** `/api/v1/jobs`
- **Description**: Get list of all jobs
- **Authentication**: None required
- **Query Parameters**: `limit`, `page`, `type`, `location`, `stream`

#### 5.2 Search Jobs
- **GET** `/api/v1/jobs/search`
- **Description**: Search jobs with filters
- **Authentication**: None required
- **Query Parameters**: `q`, `location`, `type`, `stream`, `qualification`

#### 5.3 Get Job by ID
- **GET** `/api/v1/jobs/:jobId`
- **Description**: Get specific job details
- **Authentication**: None required

#### 5.4 Create Job (Admin Only)
- **POST** `/api/v1/jobs`
- **Description**: Create a new job posting
- **Authentication**: Admin JWT token required
- **Body**:
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

#### 5.5 Update Job (Admin Only)
- **PUT** `/api/v1/jobs/:jobId`
- **Description**: Update job details
- **Authentication**: Admin JWT token required

#### 5.6 Delete Job (Admin Only)
- **DELETE** `/api/v1/jobs/:jobId`
- **Description**: Delete a job
- **Authentication**: Admin JWT token required

#### 5.7 Toggle Job Status (Admin Only)
- **PATCH** `/api/v1/jobs/:jobId/toggle-status`
- **Description**: Toggle job active/inactive status
- **Authentication**: Admin JWT token required

#### 5.8 Get Job Statistics (Admin Only)
- **GET** `/api/v1/jobs/stats/overview`
- **Description**: Get job statistics
- **Authentication**: Admin JWT token required

### 6. Job Applications

#### 6.1 Apply for Job
- **POST** `/api/v1/applications`
- **Description**: Apply for a job
- **Authentication**: JWT token required
- **Body**:
```json
{
  "jobId": "job_id_here",
  "coverLetter": "I am very interested in this position...",
  "resumeUrl": "https://example.com/resume.pdf"
}
```

#### 6.2 Get User Applications
- **GET** `/api/v1/applications`
- **Description**: Get user's job applications
- **Authentication**: JWT token required

#### 6.3 Get Application by ID
- **GET** `/api/v1/applications/:applicationId`
- **Description**: Get specific application details
- **Authentication**: JWT token required

#### 6.4 Update Application Status (Admin Only)
- **PUT** `/api/v1/applications/:applicationId/status`
- **Description**: Update application status
- **Authentication**: Admin JWT token required
- **Body**:
```json
{
  "status": "shortlisted"
}
```

### 7. Job Matching

#### 7.1 Get Job Recommendations
- **GET** `/api/v1/matching/recommendations`
- **Description**: Get personalized job recommendations
- **Authentication**: JWT token required
- **Query Parameters**: `limit`, `page`

#### 7.2 Get Matching Analytics
- **GET** `/api/v1/matching/analytics`
- **Description**: Get matching statistics
- **Authentication**: JWT token required

### 8. Subscriptions

#### 8.1 Get User Subscriptions
- **GET** `/api/v1/subscriptions`
- **Description**: Get user's subscriptions
- **Authentication**: JWT token required

#### 8.2 Create Subscription
- **POST** `/api/v1/subscriptions`
- **Description**: Create a new subscription
- **Authentication**: JWT token required
- **Body**:
```json
{
  "plan": "premium",
  "paymentMethod": "razorpay"
}
```

#### 8.3 Update Subscription
- **PUT** `/api/v1/subscriptions/:subscriptionId`
- **Description**: Update subscription details
- **Authentication**: JWT token required

#### 8.4 Cancel Subscription
- **DELETE** `/api/v1/subscriptions/:subscriptionId`
- **Description**: Cancel subscription
- **Authentication**: JWT token required

### 9. Payments

#### 9.1 Create Payment Order
- **POST** `/api/v1/payments/create-order`
- **Description**: Create Razorpay payment order
- **Authentication**: JWT token required
- **Body**:
```json
{
  "plan": "premium",
  "amount": 99,
  "currency": "INR"
}
```

#### 9.2 Verify Payment
- **POST** `/api/v1/payments/verify`
- **Description**: Verify payment signature
- **Authentication**: JWT token required
- **Body**:
```json
{
  "razorpayOrderId": "order_id_here",
  "razorpayPaymentId": "payment_id_here",
  "razorpaySignature": "signature_here"
}
```

#### 9.3 Get Payment History
- **GET** `/api/v1/payments/history`
- **Description**: Get user's payment history
- **Authentication**: JWT token required

### 10. Notifications

#### 10.1 Get User Notifications
- **GET** `/api/v1/notifications`
- **Description**: Get user's notifications
- **Authentication**: JWT token required

#### 10.2 Mark Notification as Read
- **PUT** `/api/v1/notifications/:notificationId/read`
- **Description**: Mark notification as read
- **Authentication**: JWT token required

#### 10.3 Mark All Notifications as Read
- **PUT** `/api/v1/notifications/read-all`
- **Description**: Mark all notifications as read
- **Authentication**: JWT token required

#### 10.4 Test Email Connection (Admin Only)
- **POST** `/api/v1/notifications/test-connection`
- **Description**: Test email service connection
- **Authentication**: Admin JWT token required

#### 10.5 Send Welcome Email (Admin Only)
- **POST** `/api/v1/notifications/welcome`
- **Description**: Send welcome email to user
- **Authentication**: Admin JWT token required
- **Body**:
```json
{
  "userId": "user_id_here",
  "template": "welcome",
  "context": {
    "firstName": "John",
    "plan": "premium"
  }
}
```

#### 10.6 Send Job Alert Email (Admin Only)
- **POST** `/api/v1/notifications/job-alert`
- **Description**: Send job alert email
- **Authentication**: Admin JWT token required
- **Body**:
```json
{
  "userId": "user_id_here",
  "jobId": "job_id_here",
  "template": "job-alert"
}
```

#### 10.7 Get Email Queue Status (Admin Only)
- **GET** `/api/v1/notifications/queue-status`
- **Description**: Get email queue statistics
- **Authentication**: Admin JWT token required

### 11. Admin Management

#### 11.1 Admin Login
- **POST** `/api/v1/admin/login`
- **Description**: Admin login
- **Authentication**: None required
- **Body**:
```json
{
  "email": "admin@notifyx.com",
  "password": "Admin123!"
}
```

#### 11.2 Get Dashboard Statistics
- **GET** `/api/v1/admin/dashboard`
- **Description**: Get comprehensive dashboard statistics
- **Authentication**: Admin JWT token required

#### 11.3 Get User Analytics
- **GET** `/api/v1/admin/analytics/users`
- **Description**: Get user analytics
- **Authentication**: Admin JWT token required

#### 11.4 Get Job Analytics
- **GET** `/api/v1/admin/analytics/jobs`
- **Description**: Get job analytics
- **Authentication**: Admin JWT token required

#### 11.5 Get System Health
- **GET** `/api/v1/admin/health`
- **Description**: Get system health metrics
- **Authentication**: Admin JWT token required

## 🧪 Testing Methods

### Method 1: Automated Script Testing

Run the comprehensive test script:
```bash
npx ts-node scripts/comprehensiveApiTest.ts
```

This will:
- ✅ Test health check
- ✅ Test JWT user registration/login
- ✅ Test admin JWT authentication
- ✅ Test API endpoints with tokens
- ✅ Test error handling
- 🔑 Display JWT tokens for manual testing

### Method 2: Postman Collection

1. **Import Collection**: Import `docs/NOTIFYX_POSTMAN_COLLECTION.json` into Postman
2. **Set Environment Variables**:
   - `baseUrl`: `http://localhost:3000`
   - `apiVersion`: `/api/v1`
3. **Run Tests**:
   - Start with "User Login (JWT)" to get JWT token
   - Run "Admin Login (JWT)" to get admin token
   - Test other endpoints

### Method 3: cURL Testing

#### Get JWT Token
```bash
# User Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "TestPassword123!"
  }'

# Admin Login
curl -X POST http://localhost:3000/api/v1/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@notifyx.com",
    "password": "Admin123!"
  }'
```

#### Use JWT Token
```bash
# Get user profile
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"

# Get jobs
curl -X GET http://localhost:3000/api/v1/jobs \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

## 🔍 Testing Checklist

### Core Functionality ✅
- [ ] Health check endpoint
- [ ] User registration and login (JWT)
- [ ] Admin login and authentication
- [ ] Job listing and search
- [ ] Job application process
- [ ] Job matching algorithm
- [ ] Subscription management
- [ ] Payment processing
- [ ] Email notifications
- [ ] Admin dashboard and analytics

### Security Features ✅
- [ ] JWT token authentication
- [ ] Admin role-based access control
- [ ] Input validation on all endpoints
- [ ] Protected routes require authentication
- [ ] Password strength validation

### Data Integrity ✅
- [ ] User profiles complete and accurate
- [ ] Job data properly stored and validated
- [ ] Subscription status tracking
- [ ] Application data integrity
- [ ] Payment verification

### Performance ✅
- [ ] API response times < 500ms
- [ ] Database queries optimized
- [ ] Pagination working correctly
- [ ] Search and filtering functional
- [ ] Error handling works correctly

## 🐛 Troubleshooting

### Common Issues

#### 1. "No JWT Token" Error
**Problem**: You're trying to access protected endpoints without authentication.

**Solution**: 
1. First login to get a JWT token
2. Use the token in `Authorization: Bearer <token>` header

#### 2. "Clerk Not Configured" Error
**Problem**: Clerk environment variables are missing.

**Solution**: 
1. Set up Clerk account
2. Add Clerk keys to `.env` file:
   ```
   CLERK_SECRET_KEY=your_clerk_secret_key
   CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_JWT_KEY=your_clerk_jwt_key
   ```

#### 3. "MongoDB Connection" Error
**Problem**: MongoDB is not running.

**Solution**: 
```bash
# Start MongoDB
mongod

# Or use MongoDB Atlas connection string
```

#### 4. "Admin Not Found" Error
**Problem**: Admin users don't exist in database.

**Solution**: 
```bash
# Seed test data
npx ts-node scripts/seedTestData.ts
```

### Environment Variables Required

Create `.env` file in `backend/` directory:

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/notifyx

# JWT (for legacy auth)
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRE=7d

# Clerk (for modern auth)
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_JWT_KEY=your_clerk_jwt_key
CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret

# Email (for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Razorpay (for payments)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Server
PORT=3000
NODE_ENV=development
```

## 📊 Test Results Interpretation

### Success Indicators
- ✅ All tests pass
- ✅ JWT tokens are generated
- ✅ API endpoints return expected data
- ✅ Error handling works correctly

### Failure Indicators
- ❌ Authentication failures
- ❌ Database connection issues
- ❌ Missing environment variables
- ❌ API endpoints returning errors

## 🚀 Next Steps

1. **Run Tests**: Execute the comprehensive test script
2. **Check Results**: Review test output for any failures
3. **Fix Issues**: Address any configuration or code issues
4. **Manual Testing**: Use Postman or cURL for specific endpoint testing
5. **Frontend Integration**: Set up Clerk frontend for full authentication flow

## 📞 Support

If you encounter issues:
1. Check the test output for specific error messages
2. Verify environment variables are set correctly
3. Ensure MongoDB is running
4. Check server logs for detailed error information

---

**Happy Testing! 🎉**