# NotifyX Backend Integration Guide

## 🚀 Overview

This document provides comprehensive integration guidelines for the NotifyX frontend team. It includes all available endpoints, request/response formats, authentication requirements, and field specifications for seamless frontend integration.

## 📋 Base Configuration

### Base URL
```
Development: http://localhost:3000
Production: https://api.notifyx.com
```

### API Version
```
/api/v1
```

### Authentication
- **Type**: JWT Bearer Token
- **Header**: `Authorization: Bearer <token>`
- **Token Generation**: `POST /api/v1/jwt-auth/login`

## 🔐 Authentication System

### JWT Token Generation
```http
POST /api/v1/jwt-auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "role": "user", // "user" | "admin" | "super_admin"
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user_1758355865035",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user"
    }
  },
  "timestamp": "2024-01-20T08:57:30.035Z"
}
```

### Token Verification
```http
GET /api/v1/jwt-auth/me
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_1758355865035",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user",
      "type": "user"
    }
  },
  "timestamp": "2024-01-20T08:57:30.035Z"
}
```

## 👤 User Management

### Get Current User Profile
```http
GET /api/v1/users/me
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_1758355865035",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "mobile": "9876543210",
      "role": "user",
      "subscriptionStatus": "inactive",
      "profile": {
        "firstName": "John",
        "lastName": "Doe",
        "contactNumber": "9876543210",
        "dateOfBirth": "1995-01-01",
        "qualification": "B.Tech",
        "stream": "CSE",
        "yearOfPassout": 2023,
        "cgpaOrPercentage": 8.5,
        "collegeName": "MIT",
        "address": "123 Main St",
        "city": "New York",
        "state": "NY",
        "pincode": "10001",
        "skills": "JavaScript, React, Node.js",
        "resumeUrl": "https://example.com/resume.pdf",
        "linkedinUrl": "https://linkedin.com/in/johndoe",
        "githubUrl": "https://github.com/johndoe"
      },
      "isProfileComplete": true
    }
  },
  "timestamp": "2024-01-20T08:57:30.035Z"
}
```

### Update User Profile
```http
PUT /api/v1/users/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Doe",
  "mobile": "9876543210",
  "qualification": "B.Tech",
  "stream": "CSE",
  "yearOfPassout": 2023,
  "cgpaOrPercentage": 8.5,
  "collegeName": "MIT",
  "dateOfBirth": "1995-01-01",
  "address": "123 Main St",
  "city": "New York",
  "state": "NY",
  "pincode": "10001",
  "skills": "JavaScript, React, Node.js",
  "resumeUrl": "https://example.com/resume.pdf",
  "linkedinUrl": "https://linkedin.com/in/johndoe",
  "githubUrl": "https://github.com/johndoe"
}
```

### Get Profile Completion Status
```http
GET /api/v1/users/me/completion
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "isComplete": true,
    "completionPercentage": 100,
    "missingFields": []
  },
  "timestamp": "2024-01-20T08:57:30.035Z"
}
```

## 💳 Subscription & Payment

### Get Available Plans
```http
GET /api/v1/subscriptions/plans
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "plans": [
      {
        "id": "basic",
        "name": "Basic Plan",
        "price": 99,
        "currency": "INR",
        "duration": "monthly",
        "features": ["Basic job access", "Email notifications"]
      },
      {
        "id": "premium",
        "name": "Premium Plan",
        "price": 199,
        "currency": "INR",
        "duration": "monthly",
        "features": ["Premium job access", "Priority support", "Advanced matching"]
      }
    ]
  },
  "timestamp": "2024-01-20T08:57:30.035Z"
}
```

### Create Payment Order
```http
POST /api/v1/payments/create-order
Authorization: Bearer <token>
Content-Type: application/json

{
  "plan": "premium",
  "amount": 199,
  "currency": "INR"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "order": {
      "id": "order_123456789",
      "amount": 199,
      "currency": "INR",
      "receipt": "receipt_123",
      "status": "created"
    },
    "razorpay": {
      "orderId": "order_123456789",
      "keyId": "rzp_test_123456789"
    }
  },
  "timestamp": "2024-01-20T08:57:30.035Z"
}
```

### Verify Payment
```http
POST /api/v1/payments/verify
Authorization: Bearer <token>
Content-Type: application/json

{
  "razorpay_order_id": "order_123456789",
  "razorpay_payment_id": "pay_123456789",
  "razorpay_signature": "signature_123456789",
  "plan": "premium",
  "amount": 199
}
```

### Get Current Subscription
```http
GET /api/v1/subscriptions/current
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "subscription": {
      "id": "sub_123456789",
      "plan": "premium",
      "status": "completed",
      "startDate": "2024-01-01T00:00:00.000Z",
      "endDate": "2024-02-01T00:00:00.000Z",
      "amount": 199,
      "currency": "INR"
    }
  },
  "timestamp": "2024-01-20T08:57:30.035Z"
}
```

### Get Payment History
```http
GET /api/v1/payments/history?page=1&limit=10
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "payments": [
      {
        "id": "pay_123456789",
        "amount": 199,
        "currency": "INR",
        "status": "completed",
        "plan": "premium",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "pages": 1
    }
  },
  "timestamp": "2024-01-20T08:57:30.035Z"
}
```

## 💼 Job Management

### Get All Jobs (Public)
```http
GET /api/v1/jobs?page=1&limit=10&type=job&location=remote
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `type`: Job type ("job" | "internship")
- `location`: Location type ("remote" | "onsite" | "hybrid")
- `search`: Search term

**Response:**
```json
{
  "success": true,
  "data": {
    "jobs": [
      {
        "id": "job_123456789",
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
        "salary": "₹8-12 LPA",
        "isActive": true,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "pages": 5
    }
  },
  "timestamp": "2024-01-20T08:57:30.035Z"
}
```

### Get Job by ID
```http
GET /api/v1/jobs/{jobId}
```

### Search Jobs
```http
GET /api/v1/jobs/search?q=engineer&location=remote&type=job
```

### Apply for Job
```http
POST /api/v1/applications/{jobId}/apply
Authorization: Bearer <token>
Content-Type: application/json

{
  "resumeUrl": "https://example.com/resume.pdf",
  "coverLetter": "I am very interested in this position..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "application": {
      "id": "app_123456789",
      "jobId": "job_123456789",
      "userId": "user_123456789",
      "status": "applied",
      "resumeUrl": "https://example.com/resume.pdf",
      "coverLetter": "I am very interested in this position...",
      "appliedAt": "2024-01-20T08:57:30.035Z"
    }
  },
  "timestamp": "2024-01-20T08:57:30.035Z"
}
```

### Get User Applications
```http
GET /api/v1/applications/my-applications?page=1&limit=10&status=applied
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "applications": [
      {
        "id": "app_123456789",
        "job": {
          "id": "job_123456789",
          "title": "Software Engineer",
          "company": "Tech Corp"
        },
        "status": "applied",
        "appliedAt": "2024-01-20T08:57:30.035Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "pages": 1
    }
  },
  "timestamp": "2024-01-20T08:57:30.035Z"
}
```

### Withdraw Application
```http
PATCH /api/v1/applications/{applicationId}/withdraw
Authorization: Bearer <token>
```

## 🎯 Job Matching & Recommendations

### Get Job Recommendations
```http
GET /api/v1/matching/recommendations?limit=10
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "job": {
          "id": "job_123456789",
          "title": "Software Engineer",
          "company": "Tech Corp",
          "location": "remote",
          "salary": "₹8-12 LPA"
        },
        "matchScore": 85,
        "matchReasons": ["Qualification match", "Stream match", "Location preference"]
      }
    ],
    "totalRecommendations": 10,
    "userProfile": {
      "qualification": "B.Tech",
      "stream": "CSE",
      "yearOfPassout": 2023,
      "skills": ["JavaScript", "React", "Node.js"]
    }
  },
  "timestamp": "2024-01-20T08:57:30.035Z"
}
```

### Get Matching Analytics
```http
GET /api/v1/matching/analytics
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "analytics": {
      "totalRecommendations": 50,
      "averageMatchScore": 75,
      "topMatchCategories": ["CSE", "IT"],
      "preferredLocations": ["remote", "hybrid"],
      "skillMatches": ["JavaScript", "React", "Node.js"]
    }
  },
  "timestamp": "2024-01-20T08:57:30.035Z"
}
```

## 📧 Email Notifications

### Test Email Connection (Admin)
```http
GET /api/v1/notifications/test-connection
Authorization: Bearer <admin_token>
```

### Send Welcome Email (Admin)
```http
POST /api/v1/notifications/welcome
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "John Doe"
}
```

### Send Job Alert Email (Admin)
```http
POST /api/v1/notifications/job-alert
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "userId": "user_123456789",
  "jobId": "job_123456789"
}
```

### Get Email Queue Status (Admin)
```http
GET /api/v1/notifications/queue-status
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "queueStatus": {
      "waiting": 0,
      "active": 0,
      "completed": 25,
      "failed": 2,
      "delayed": 0
    }
  },
  "timestamp": "2024-01-20T08:57:30.035Z"
}
```

## 👑 Admin Dashboard

### Get Dashboard Statistics
```http
GET /api/v1/admin/dashboard
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalUsers": 1250,
      "activeUsers": 850,
      "totalJobs": 150,
      "activeJobs": 120,
      "totalApplications": 2500,
      "pendingApplications": 150,
      "totalRevenue": 25000,
      "monthlyRevenue": 5000
    }
  },
  "timestamp": "2024-01-20T08:57:30.035Z"
}
```

### Get User Analytics
```http
GET /api/v1/admin/analytics/users
Authorization: Bearer <admin_token>
```

### Get Job Analytics
```http
GET /api/v1/admin/analytics/jobs
Authorization: Bearer <admin_token>
```

### Get System Health
```http
GET /api/v1/admin/health
Authorization: Bearer <admin_token>
```

## 🔧 Health Check

### API Health Check
```http
GET /health
```

**Response:**
```json
{
  "success": true,
  "message": "NotifyX API is running",
  "version": "1.0.0",
  "timestamp": "2024-01-20T08:57:30.035Z",
  "uptime": 123.45
}
```

## 📊 Data Models

### User Profile Fields
```typescript
interface UserProfile {
  firstName: string;
  lastName: string;
  contactNumber: string;
  dateOfBirth: string; // ISO date
  qualification: string;
  stream: string;
  yearOfPassout: number;
  cgpaOrPercentage: number;
  collegeName: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string; // 6-digit Indian pincode
  skills?: string;
  resumeUrl?: string;
  linkedinUrl?: string;
  githubUrl?: string;
}
```

### Job Fields
```typescript
interface Job {
  id: string;
  title: string;
  company: string;
  description: string;
  type: 'job' | 'internship';
  eligibility: {
    qualifications: string[];
    streams: string[];
    passoutYears: number[];
    minCGPA?: number;
  };
  applicationDeadline: string; // ISO date
  applicationLink: string;
  location: 'remote' | 'onsite' | 'hybrid';
  salary?: string;
  stipend?: string;
  isActive: boolean;
  createdAt: string; // ISO date
}
```

### Application Fields
```typescript
interface JobApplication {
  id: string;
  jobId: string;
  userId: string;
  status: 'applied' | 'shortlisted' | 'rejected' | 'withdrawn';
  resumeUrl: string;
  coverLetter?: string;
  appliedAt: string; // ISO date
  job?: Job; // Populated in responses
}
```

## 🚨 Error Handling

### Standard Error Response
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": "Additional error details"
  },
  "timestamp": "2024-01-20T08:57:30.035Z"
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

### Validation Error Example
```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "details": {
      "mobile": "Invalid phone number format",
      "email": "Email is required"
    }
  },
  "timestamp": "2024-01-20T08:57:30.035Z"
}
```

## 🔒 Security Considerations

### Authentication
- Always include JWT token in Authorization header
- Token expires after 24 hours (configurable)
- Refresh token on expiration

### Input Validation
- All inputs are validated server-side
- Phone numbers must be 10-digit Indian format
- Email addresses must be valid format
- URLs must be valid format
- Date fields must be ISO format

### Rate Limiting
- API calls are rate-limited (configurable)
- Admin endpoints have higher limits
- Webhook endpoints have separate limits

## 🚀 Frontend Integration Checklist

### Setup
- [ ] Configure base URL for environment
- [ ] Implement JWT token storage and management
- [ ] Set up error handling for API responses
- [ ] Configure request/response interceptors

### Authentication
- [ ] Implement login/logout functionality
- [ ] Handle token expiration and refresh
- [ ] Implement role-based access control
- [ ] Store user profile data

### User Management
- [ ] Implement profile creation/update forms
- [ ] Handle profile completion tracking
- [ ] Implement profile validation
- [ ] Display user dashboard

### Job Management
- [ ] Implement job listing with filters
- [ ] Create job detail pages
- [ ] Implement job application flow
- [ ] Handle application status tracking

### Subscription & Payment
- [ ] Integrate Razorpay payment gateway
- [ ] Implement subscription plans display
- [ ] Handle payment verification
- [ ] Track subscription status

### Job Matching
- [ ] Implement recommendation display
- [ ] Create matching analytics dashboard
- [ ] Handle recommendation preferences
- [ ] Display match scores and reasons

### Admin Features
- [ ] Implement admin dashboard
- [ ] Create user management interface
- [ ] Implement job management tools
- [ ] Handle analytics display

## 📝 Testing

### Test Endpoints
- Use the JWT token generator for testing: `POST /api/v1/jwt-auth/login`
- Test with both user and admin tokens
- Verify all CRUD operations
- Test error scenarios

### Mock Data
- Use the provided test data in responses
- Test with various user profiles
- Test with different job types and locations
- Test payment flows with test mode

## 🔄 API Updates

### Versioning
- Current API version: v1
- Breaking changes will increment version
- Deprecated endpoints will be marked and removed in future versions

### Changelog
- Monitor API changelog for updates
- Subscribe to API notifications
- Update frontend integration as needed

---

**Happy Integrating! 🚀**

This guide provides all the necessary information for frontend integration. For additional support, refer to the API documentation or contact the backend team.
