# NotifyX Backend API Documentation

## 🚀 Overview

NotifyX is a comprehensive job notification platform that matches users with relevant job opportunities. This API provides endpoints for user management, job matching, subscription processing, and administrative operations.

**Base URL**: `http://localhost:3000/api/v1`
**Version**: 1.0.0
**Authentication**: JWT Bearer Token (Clerk-based)

## 📋 Table of Contents

1. [Authentication & Authorization](#authentication--authorization)
2. [User Management](#user-management)
3. [Job Management](#job-management)
4. [Job Applications](#job-applications)
5. [Job Matching](#job-matching)
6. [Subscription Management](#subscription-management)
7. [Payment Integration](#payment-integration)
8. [Email Notifications](#email-notifications)
9. [Admin Dashboard](#admin-dashboard)
10. [Error Handling](#error-handling)
11. [Rate Limiting](#rate-limiting)

---

## 🔐 Authentication & Authorization

### Authentication Flow

1. **User Registration**: Users register through Clerk authentication
2. **JWT Token**: Clerk provides JWT tokens for API access
3. **Authorization Header**: Include token in `Authorization: Bearer <token>` header
4. **Role-Based Access**: Different endpoints require different user roles

### Clerk Authentication Endpoints

#### Webhook Handler
```http
POST /api/v1/clerk-auth/webhook
Content-Type: application/json
```

**Purpose**: Handle Clerk webhook events for user lifecycle management

**Headers Required**:
- `svix-id`: Webhook signature ID
- `svix-timestamp`: Webhook timestamp
- `svix-signature`: Webhook signature

**Response**: `200 OK` on successful webhook processing

#### Get Current User
```http
GET /api/v1/clerk-auth/me
Authorization: Bearer <clerk_jwt_token>
```

**Response**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user",
      "clerkUserId": "clerk_user_123",
      "subscriptionStatus": "active",
      "subscriptionPlan": "premium",
      "isProfileComplete": true
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### Update User Profile
```http
PUT /api/v1/clerk-auth/profile
Authorization: Bearer <clerk_jwt_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "location": "New York"
}
```

---

## 👥 User Management

### Get User Profile
```http
GET /api/v1/users/profile
Authorization: Bearer <clerk_jwt_token>
```

### Update User Profile
```http
PUT /api/v1/users/profile
Authorization: Bearer <clerk_jwt_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "dateOfBirth": "1995-01-01",
  "qualification": "B.Tech",
  "customQualification": null,
  "stream": "CSE",
  "customStream": null,
  "yearOfPassout": 2023,
  "cgpaOrPercentage": 8.5,
  "collegeName": "MIT"
}
```

### Get Profile Completion Status
```http
GET /api/v1/users/profile/completion
Authorization: Bearer <clerk_jwt_token>
```

**Response**:
```json
{
  "success": true,
  "data": {
    "isComplete": true,
    "completionPercentage": 100,
    "missingFields": [],
    "profile": {
      "firstName": "John",
      "lastName": "Doe",
      "qualification": "B.Tech",
      "stream": "CSE",
      "yearOfPassout": 2023
    }
  }
}
```

---

## 💼 Job Management

### Get All Jobs (User View)
```http
GET /api/v1/jobs?page=1&limit=20&type=job&location=remote&search=software
Authorization: Bearer <clerk_jwt_token>
```

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `type`: Job type (`job` or `internship`)
- `location`: Location type (`remote`, `onsite`, `hybrid`)
- `search`: Search in title, company, or description
- `qualification`: Filter by qualification
- `stream`: Filter by stream
- `yearOfPassout`: Filter by passout year

**Response**:
```json
{
  "success": true,
  "data": {
    "jobs": [
      {
        "id": "job_123",
        "title": "Software Engineer",
        "company": "Tech Corp",
        "description": "We are looking for...",
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
        "salary": "₹8-12 LPA",
        "isActive": true,
        "postedBy": "admin_123",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalJobs": 100,
      "hasNextPage": true,
      "hasPrevPage": false,
      "limit": 20
    }
  }
}
```

### Get Job by ID
```http
GET /api/v1/jobs/:jobId
Authorization: Bearer <clerk_jwt_token>
```

### Admin: Create Job
```http
POST /api/v1/admin/jobs
Authorization: Bearer <admin_clerk_jwt_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "title": "Software Engineer",
  "company": "Tech Corp",
  "description": "We are looking for...",
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

### Admin: Update Job
```http
PUT /api/v1/admin/jobs/:jobId
Authorization: Bearer <admin_clerk_jwt_token>
Content-Type: application/json
```

### Admin: Delete Job
```http
DELETE /api/v1/admin/jobs/:jobId
Authorization: Bearer <admin_clerk_jwt_token>
```

---

## 📝 Job Applications

### Apply for Job
```http
POST /api/v1/job-applications
Authorization: Bearer <clerk_jwt_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "jobId": "job_123",
  "coverLetter": "I am interested in this position...",
  "resume": "base64_encoded_resume_or_url"
}
```

### Get User Applications
```http
GET /api/v1/job-applications?page=1&limit=20&status=applied
Authorization: Bearer <clerk_jwt_token>
```

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `status`: Application status (`applied`, `shortlisted`, `rejected`, `accepted`)

### Get Application Details
```http
GET /api/v1/job-applications/:applicationId
Authorization: Bearer <clerk_jwt_token>
```

---

## 🎯 Job Matching

### Get Job Recommendations
```http
GET /api/v1/job-matching/recommendations?limit=10
Authorization: Bearer <clerk_jwt_token>
```

**Response**:
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "job": {
          "id": "job_123",
          "title": "Software Engineer",
          "company": "Tech Corp",
          "matchScore": 95,
          "matchReasons": [
            "Qualification matches (B.Tech)",
            "Stream matches (CSE)",
            "Passout year eligible (2023)",
            "CGPA requirement met (8.5 >= 7.5)"
          ]
        }
      }
    ],
    "totalMatches": 25,
    "userProfile": {
      "qualification": "B.Tech",
      "stream": "CSE",
      "yearOfPassout": 2023,
      "cgpaOrPercentage": 8.5
    }
  }
}
```

### Get Matching Analytics
```http
GET /api/v1/job-matching/analytics
Authorization: Bearer <clerk_jwt_token>
```

---

## 💳 Subscription Management

### Get Subscription Plans
```http
GET /api/v1/subscriptions/plans
```

**Response**:
```json
{
  "success": true,
  "data": {
    "plans": [
      {
        "id": "basic",
        "name": "Basic Plan",
        "price": 49,
        "currency": "INR",
        "duration": "30 days",
        "features": [
          "Job notifications",
          "Basic job matching",
          "Email support"
        ]
      },
      {
        "id": "premium",
        "name": "Premium Plan",
        "price": 99,
        "currency": "INR",
        "duration": "30 days",
        "features": [
          "Priority job notifications",
          "Advanced job matching",
          "Priority support",
          "Analytics dashboard"
        ]
      }
    ]
  }
}
```

### Get User Subscription Status
```http
GET /api/v1/subscriptions/status
Authorization: Bearer <clerk_jwt_token>
```

**Response**:
```json
{
  "success": true,
  "data": {
    "subscription": {
      "plan": "premium",
      "status": "active",
      "startDate": "2024-01-01T00:00:00.000Z",
      "endDate": "2024-01-31T23:59:59.999Z",
      "isActive": true,
      "amount": 99,
      "paymentId": "pay_123",
      "orderId": "order_123"
    }
  }
}
```

### Get Subscription History
```http
GET /api/v1/subscriptions/history?page=1&limit=20
Authorization: Bearer <clerk_jwt_token>
```

---

## 💰 Payment Integration

### Create Payment Order
```http
POST /api/v1/payments/create-order
Authorization: Bearer <clerk_jwt_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "plan": "premium",
  "amount": 99,
  "currency": "INR"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "order": {
      "id": "order_123",
      "amount": 99,
      "currency": "INR",
      "receipt": "receipt_123",
      "status": "created"
    },
    "razorpay": {
      "key": "rzp_test_123",
      "orderId": "order_123",
      "amount": 9900,
      "currency": "INR",
      "description": "NotifyX Premium Subscription"
    }
  }
}
```

### Verify Payment
```http
POST /api/v1/payments/verify
Authorization: Bearer <clerk_jwt_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "razorpayOrderId": "order_123",
  "razorpayPaymentId": "pay_123",
  "razorpaySignature": "signature_123"
}
```

### Get Payment History
```http
GET /api/v1/payments/history?page=1&limit=20
Authorization: Bearer <clerk_jwt_token>
```

---

## 📧 Email Notifications

### Send Welcome Email
```http
POST /api/v1/notifications/welcome
Authorization: Bearer <admin_clerk_jwt_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "userId": "user_123",
  "template": "welcome",
  "context": {
    "firstName": "John",
    "plan": "premium"
  }
}
```

### Send Job Alert Email
```http
POST /api/v1/notifications/job-alert
Authorization: Bearer <admin_clerk_jwt_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "userId": "user_123",
  "jobId": "job_123",
  "template": "job-alert"
}
```

### Send Bulk Job Alerts
```http
POST /api/v1/notifications/bulk-job-alerts
Authorization: Bearer <admin_clerk_jwt_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "jobId": "job_123",
  "userIds": ["user_1", "user_2", "user_3"],
  "template": "job-alert"
}
```

### Get Email Queue Status
```http
GET /api/v1/notifications/queue-status
Authorization: Bearer <admin_clerk_jwt_token>
```

### Test Email Connection
```http
POST /api/v1/notifications/test-connection
Authorization: Bearer <admin_clerk_jwt_token>
```

---

## 🏛️ Admin Dashboard

### Get Dashboard Statistics
```http
GET /api/v1/admin/dashboard/stats
Authorization: Bearer <admin_clerk_jwt_token>
```

### Get User Analytics
```http
GET /api/v1/admin/dashboard/user-analytics?period=30d
Authorization: Bearer <admin_clerk_jwt_token>
```

### Get Job Analytics
```http
GET /api/v1/admin/dashboard/job-analytics
Authorization: Bearer <admin_clerk_jwt_token>
```

### Get System Health
```http
GET /api/v1/admin/dashboard/system-health
Authorization: Bearer <admin_clerk_jwt_token>
```

### Admin: Get All Users
```http
GET /api/v1/admin/users?page=1&limit=20&search=john&role=user
Authorization: Bearer <admin_clerk_jwt_token>
```

### Admin: Update User Role
```http
PUT /api/v1/admin/users/:userId
Authorization: Bearer <admin_clerk_jwt_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "role": "admin",
  "isActive": true,
  "subscriptionStatus": "active"
}
```

### Admin: Get All Jobs
```http
GET /api/v1/admin/jobs?page=1&limit=20&status=pending
Authorization: Bearer <admin_clerk_jwt_token>
```

### Admin: Get Moderation Queue
```http
GET /api/v1/admin/jobs/moderation/queue?status=pending
Authorization: Bearer <admin_clerk_jwt_token>
```

### Admin: Get Audit Logs
```http
GET /api/v1/admin/audit-logs?page=1&limit=50
Authorization: Bearer <admin_clerk_jwt_token>
```

### Admin: Export Audit Logs
```http
GET /api/v1/admin/audit-logs/export?startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer <admin_clerk_jwt_token>
```

**Response**: CSV file download

---

## ❌ Error Handling

### Standard Error Response Format
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": {}
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Common HTTP Status Codes

- **200**: Success
- **201**: Created
- **400**: Bad Request (validation errors)
- **401**: Unauthorized (missing/invalid token)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found
- **409**: Conflict (duplicate resource)
- **422**: Unprocessable Entity
- **429**: Too Many Requests (rate limiting)
- **500**: Internal Server Error

### Error Codes

- `VALIDATION_ERROR`: Input validation failed
- `AUTHENTICATION_FAILED`: Invalid or expired token
- `INSUFFICIENT_PERMISSIONS`: User lacks required role
- `RESOURCE_NOT_FOUND`: Requested resource doesn't exist
- `DUPLICATE_RESOURCE`: Resource already exists
- `PAYMENT_FAILED`: Payment processing error
- `EMAIL_SEND_FAILED`: Email delivery error
- `RATE_LIMIT_EXCEEDED`: Too many requests

---

## 🚦 Rate Limiting

### Rate Limit Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

### Rate Limits by Endpoint Type

- **Authentication**: 5 requests per minute
- **User Operations**: 100 requests per hour
- **Job Operations**: 200 requests per hour
- **Admin Operations**: 50 requests per hour
- **Payment Operations**: 10 requests per minute

---

## 🔧 Development & Testing

### Environment Variables Required

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/notifyx

# Clerk Authentication
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_JWT_KEY=your_clerk_jwt_key
CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret

# Email Service
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Razorpay
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Redis (for email queue)
REDIS_HOST=localhost
REDIS_PORT=6379

# Server
PORT=3000
NODE_ENV=development
```

### Local Development Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start MongoDB**:
   ```bash
   mongod
   ```

3. **Start Redis** (optional, for email queue):
   ```bash
   redis-server
   ```

4. **Set Environment Variables**:
   ```bash
   cp .env.template .env
   # Edit .env with your values
   ```

5. **Start Development Server**:
   ```bash
   npm run dev
   ```

### Testing with Postman

1. **Import Postman Collection**: Use the provided collection file
2. **Set Environment Variables**: Configure your local environment
3. **Get Clerk Token**: Use Clerk dashboard or authentication flow
4. **Test Endpoints**: Follow the testing guide for each endpoint

---

## 📚 Additional Resources

- [Clerk Documentation](https://clerk.com/docs)
- [Razorpay API Documentation](https://razorpay.com/docs/api/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Express.js Documentation](https://expressjs.com/)

## 🤝 Support

For API support and questions:
- Check the application logs
- Review error responses
- Contact the development team
- Submit issues through the project repository
