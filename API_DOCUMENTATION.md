# X_Career Backend API Documentation

## Overview
This document provides comprehensive API documentation for the X_Career Backend system, including all endpoints, request/response formats, authentication requirements, and frontend integration guidelines.

## Base URL
```
http://localhost:3001/api/v1
```

## Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

---

## 1. Authentication Endpoints

### 1.1 User Registration
**POST** `/auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123!",
  "name": "John Doe",
  "mobile": "9876543210"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "user",
      "subscriptionStatus": "inactive",
      "subscriptionPlan": "basic"
    },
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token"
  }
}
```

### 1.2 User Login
**POST** `/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "user",
      "subscriptionStatus": "active",
      "subscriptionPlan": "premium"
    },
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token"
  }
}
```

### 1.3 Change Password
**POST** `/auth/change-password`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword123!"
}
```

### 1.4 Refresh Token
**POST** `/auth/refresh-token`

**Request Body:**
```json
{
  "refreshToken": "refresh_token"
}
```

### 1.5 Logout
**POST** `/auth/logout`

**Headers:** `Authorization: Bearer <token>`

---

## 2. User Management

### 2.1 Get User Profile
**GET** `/users/profile`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "John Doe",
    "mobile": "9876543210",
    "role": "user",
    "subscriptionStatus": "active",
    "subscriptionPlan": "premium",
    "isProfileComplete": true,
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

### 2.2 Update User Profile
**PUT** `/users/profile`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "John Updated",
  "mobile": "9876543211"
}
```

### 2.3 Get All Users (Admin Only)
**GET** `/users?page=1&limit=10&search=john&role=user`

**Headers:** `Authorization: Bearer <admin_token>`

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)
- `search`: Search term for name/email
- `role`: Filter by role (user, admin, super_admin)
- `subscriptionStatus`: Filter by subscription status
- `subscriptionPlan`: Filter by subscription plan

---

## 3. Subscription Management

### 3.1 Get Current Subscription
**GET** `/subscriptions/current`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "subscription_id",
    "userId": "user_id",
    "plan": "premium",
    "status": "active",
    "startDate": "2025-01-01T00:00:00.000Z",
    "endDate": "2025-02-01T00:00:00.000Z",
    "paymentId": "payment_id",
    "orderId": "order_id"
  }
}
```

### 3.2 Create Subscription
**POST** `/subscriptions`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "plan": "premium",
  "paymentId": "payment_id",
  "orderId": "order_id"
}
```

### 3.3 Get All Subscriptions (Admin Only)
**GET** `/subscriptions?page=1&limit=10&status=active&plan=premium`

**Headers:** `Authorization: Bearer <admin_token>`

---

## 4. Payment Integration

### 4.1 Create Payment Order
**POST** `/payments/create-order`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "amount": 999,
  "currency": "INR",
  "plan": "premium",
  "duration": "monthly"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orderId": "order_123",
    "amount": 999,
    "currency": "INR",
    "keyId": "rzp_test_key",
    "order": {
      "id": "order_123",
      "amount": 999,
      "currency": "INR",
      "receipt": "receipt_123"
    }
  }
}
```

### 4.2 Verify Payment
**POST** `/payments/verify`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "razorpay_order_id": "order_123",
  "razorpay_payment_id": "pay_123",
  "razorpay_signature": "signature_123"
}
```

### 4.3 Get Payment History
**GET** `/payments/history?page=1&limit=10`

**Headers:** `Authorization: Bearer <token>`

---

## 5. Job Management

### 5.1 Get All Jobs
**GET** `/jobs?page=1&limit=10&search=developer&location=mumbai&type=full-time`

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `search`: Search term for title/company
- `location`: Filter by location
- `type`: Filter by job type (full-time, part-time, contract, internship)
- `qualifications`: Filter by required qualifications
- `streams`: Filter by required streams
- `passoutYears`: Filter by passout years

**Response:**
```json
{
  "success": true,
  "data": {
    "jobs": [
      {
        "id": "job_id",
        "title": "Software Developer",
        "company": "Tech Corp",
        "location": "Mumbai",
        "type": "full-time",
        "description": "Job description...",
        "requirements": ["B.Tech", "2+ years experience"],
        "eligibility": {
          "qualifications": ["B.Tech", "M.Tech"],
          "streams": ["Computer Science", "IT"],
          "passoutYears": [2020, 2021, 2022, 2023, 2024]
        },
        "salary": {
          "min": 500000,
          "max": 800000,
          "currency": "INR"
        },
        "postedBy": "admin_id",
        "isActive": true,
        "createdAt": "2025-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "pages": 10
    }
  }
}
```

### 5.2 Get Job by ID
**GET** `/jobs/:jobId`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "job_id",
    "title": "Software Developer",
    "company": "Tech Corp",
    "location": "Mumbai",
    "type": "full-time",
    "description": "Detailed job description...",
    "requirements": ["B.Tech", "2+ years experience"],
    "eligibility": {
      "qualifications": ["B.Tech", "M.Tech"],
      "streams": ["Computer Science", "IT"],
      "passoutYears": [2020, 2021, 2022, 2023, 2024]
    },
    "salary": {
      "min": 500000,
      "max": 800000,
      "currency": "INR"
    },
    "postedBy": "admin_id",
    "isActive": true,
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

### 5.3 Search Jobs
**GET** `/jobs/search?q=developer&location=mumbai&type=full-time`

### 5.4 Apply for Job
**POST** `/jobs/:jobId/apply`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "resumeUrl": "https://example.com/resume.pdf",
  "coverLetter": "I am interested in this position...",
  "additionalInfo": "Any additional information"
}
```

### 5.5 Get User Applications
**GET** `/applications?page=1&limit=10&status=pending`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `status`: Filter by application status (pending, reviewed, accepted, rejected)

### 5.6 Get Job Applications (Admin Only)
**GET** `/jobs/:jobId/applications?page=1&limit=10&status=pending`

**Headers:** `Authorization: Bearer <admin_token>`

### 5.7 Update Application Status (Admin Only)
**PUT** `/applications/:applicationId/status`

**Headers:** `Authorization: Bearer <admin_token>`

**Request Body:**
```json
{
  "status": "accepted",
  "adminNotes": "Great candidate, hired!"
}
```

---

## 6. Admin Dashboard

### 6.1 Get Dashboard Stats
**GET** `/admin/dashboard`

**Headers:** `Authorization: Bearer <admin_token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "users": {
      "total": 1000,
      "active": 800,
      "newThisMonth": 50
    },
    "subscriptions": {
      "total": 500,
      "active": 400,
      "revenue": 500000
    },
    "jobs": {
      "total": 200,
      "active": 150,
      "applications": 1000
    },
    "recentActivity": [
      {
        "type": "user_registration",
        "message": "New user registered",
        "timestamp": "2025-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

### 6.2 Get User Management
**GET** `/admin/users?page=1&limit=10&search=john&role=user&subscriptionStatus=active`

**Headers:** `Authorization: Bearer <admin_token>`

### 6.3 Update User (Admin Only)
**PUT** `/admin/users/:userId`

**Headers:** `Authorization: Bearer <admin_token>`

**Request Body:**
```json
{
  "role": "admin",
  "subscriptionStatus": "active",
  "subscriptionPlan": "premium"
}
```

### 6.4 Get Subscription Management
**GET** `/admin/subscriptions?page=1&limit=10&status=active&plan=premium`

**Headers:** `Authorization: Bearer <admin_token>`

---

## 7. Notification System

### 7.1 Get User Notifications
**GET** `/notifications?page=1&limit=10&type=job_alert&status=unread`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `type`: Filter by notification type (job_alert, subscription, payment, system, profile, application)
- `status`: Filter by status (unread, read, archived)
- `priority`: Filter by priority (low, medium, high, urgent)

**Response:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "notification_id",
        "type": "job_alert",
        "title": "New Job Alert",
        "message": "A new job matching your profile is available",
        "priority": "medium",
        "category": "info",
        "status": "unread",
        "actionUrl": "/jobs/job_id",
        "actionText": "View Job",
        "createdAt": "2025-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "pages": 5
    }
  }
}
```

### 7.2 Mark Notification as Read
**PUT** `/notifications/:notificationId/read`

**Headers:** `Authorization: Bearer <token>`

### 7.3 Mark All Notifications as Read
**PUT** `/notifications/mark-all-read`

**Headers:** `Authorization: Bearer <token>`

### 7.4 Create Notification (Admin Only)
**POST** `/notifications`

**Headers:** `Authorization: Bearer <admin_token>`

**Request Body:**
```json
{
  "userId": "user_id",
  "type": "system",
  "title": "System Maintenance",
  "message": "Scheduled maintenance on Sunday",
  "priority": "high",
  "category": "info",
  "actionUrl": "/maintenance",
  "actionText": "Learn More"
}
```

### 7.5 Bulk Create Notifications (Admin Only)
**POST** `/notifications/bulk`

**Headers:** `Authorization: Bearer <admin_token>`

**Request Body:**
```json
{
  "notifications": [
    {
      "userId": "user_id_1",
      "type": "job_alert",
      "title": "New Job Alert",
      "message": "New job matching your profile"
    },
    {
      "userId": "user_id_2",
      "type": "job_alert",
      "title": "New Job Alert",
      "message": "New job matching your profile"
    }
  ]
}
```

---

## 8. Resume Template Management

### 8.1 Get Resume Templates
**GET** `/templates?page=1&limit=10&category=professional`

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `category`: Filter by category (professional, creative, academic, modern)
- `isPremium`: Filter by premium status

**Response:**
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "id": "template_id",
        "name": "Professional Template",
        "description": "Clean and professional resume template",
        "category": "professional",
        "previewUrl": "https://example.com/preview.jpg",
        "downloadUrl": "https://example.com/template.docx",
        "isPremium": true,
        "isActive": true,
        "createdAt": "2025-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 20,
      "pages": 2
    }
  }
}
```

### 8.2 Get Template by ID
**GET** `/templates/:templateId`

### 8.3 Create Template (Admin Only)
**POST** `/templates`

**Headers:** `Authorization: Bearer <admin_token>`

**Request Body:**
```json
{
  "name": "New Template",
  "description": "Template description",
  "category": "professional",
  "previewUrl": "https://example.com/preview.jpg",
  "downloadUrl": "https://example.com/template.docx",
  "isPremium": true
}
```

### 8.4 Update Template (Admin Only)
**PUT** `/templates/:templateId`

**Headers:** `Authorization: Bearer <admin_token>`

### 8.5 Delete Template (Admin Only)
**DELETE** `/templates/:templateId`

**Headers:** `Authorization: Bearer <admin_token>`

---

## 9. Performance Monitoring (Admin Only)

### 9.1 Get Performance Stats
**GET** `/performance/stats`

**Headers:** `Authorization: Bearer <admin_token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "totalQueries": 1000,
    "averageResponseTime": 150.5,
    "slowQueries": 10,
    "errorRate": 0.02,
    "topSlowQueries": [
      {
        "operation": "find",
        "collection": "users",
        "averageDuration": 500,
        "count": 5
      }
    ]
  }
}
```

### 9.2 Get Recent Metrics
**GET** `/performance/metrics?limit=50`

**Headers:** `Authorization: Bearer <admin_token>`

### 9.3 Get Index Stats
**GET** `/performance/indexes`

**Headers:** `Authorization: Bearer <admin_token>`

### 9.4 Clear Performance Metrics
**DELETE** `/performance/clear`

**Headers:** `Authorization: Bearer <admin_token>`

---

## 10. Health Check

### 10.1 Health Check
**GET** `/health`

**Response:**
```json
{
  "status": "OK",
  "message": "NotifyX Backend is running",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "environment": "development"
}
```

---

## Frontend Integration Requirements

### 1. Authentication Flow
```javascript
// Login
const login = async (email, password) => {
  const response = await fetch('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await response.json();
  
  if (data.success) {
    localStorage.setItem('accessToken', data.data.accessToken);
    localStorage.setItem('refreshToken', data.data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.data.user));
  }
  return data;
};

// API calls with authentication
const apiCall = async (url, options = {}) => {
  const token = localStorage.getItem('accessToken');
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    }
  });
};
```

### 2. Error Handling
```javascript
const handleApiError = (error) => {
  if (error.status === 401) {
    // Token expired, redirect to login
    localStorage.clear();
    window.location.href = '/login';
  } else if (error.status === 403) {
    // Insufficient permissions
    showError('You do not have permission to perform this action');
  } else if (error.status === 429) {
    // Rate limited
    showError('Too many requests. Please try again later.');
  } else {
    // Generic error
    showError(error.message || 'An error occurred');
  }
};
```

### 3. Subscription Status Check
```javascript
const checkSubscriptionStatus = async () => {
  try {
    const response = await apiCall('/api/v1/subscriptions/current');
    const data = await response.json();
    
    if (data.success) {
      const subscription = data.data;
      if (subscription.status === 'active') {
        // User has active subscription
        return true;
      } else {
        // User needs to subscribe
        showSubscriptionModal();
        return false;
      }
    }
  } catch (error) {
    console.error('Error checking subscription:', error);
    return false;
  }
};
```

### 4. Job Application Flow
```javascript
const applyForJob = async (jobId, resumeUrl, coverLetter) => {
  try {
    const response = await apiCall(`/api/v1/jobs/${jobId}/apply`, {
      method: 'POST',
      body: JSON.stringify({
        resumeUrl,
        coverLetter,
        additionalInfo: ''
      })
    });
    
    const data = await response.json();
    if (data.success) {
      showSuccess('Application submitted successfully!');
      // Refresh job list or redirect
    } else {
      showError(data.error.message);
    }
  } catch (error) {
    handleApiError(error);
  }
};
```

### 5. Notification Management
```javascript
const getNotifications = async (page = 1, limit = 10) => {
  try {
    const response = await apiCall(`/api/v1/notifications?page=${page}&limit=${limit}`);
    const data = await response.json();
    
    if (data.success) {
      return data.data.notifications;
    }
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
};

const markNotificationAsRead = async (notificationId) => {
  try {
    await apiCall(`/api/v1/notifications/${notificationId}/read`, {
      method: 'PUT'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
};
```

### 6. Payment Integration
```javascript
const createPaymentOrder = async (plan, amount) => {
  try {
    const response = await apiCall('/api/v1/payments/create-order', {
      method: 'POST',
      body: JSON.stringify({
        amount,
        currency: 'INR',
        plan,
        duration: 'monthly'
      })
    });
    
    const data = await response.json();
    if (data.success) {
      // Initialize Razorpay
      const options = {
        key: data.data.keyId,
        amount: data.data.amount,
        currency: data.data.currency,
        name: 'X_Career',
        description: `${plan} Subscription`,
        order_id: data.data.order.id,
        handler: async (response) => {
          await verifyPayment(response);
        }
      };
      
      const rzp = new Razorpay(options);
      rzp.open();
    }
  } catch (error) {
    handleApiError(error);
  }
};

const verifyPayment = async (paymentResponse) => {
  try {
    const response = await apiCall('/api/v1/payments/verify', {
      method: 'POST',
      body: JSON.stringify({
        razorpay_order_id: paymentResponse.razorpay_order_id,
        razorpay_payment_id: paymentResponse.razorpay_payment_id,
        razorpay_signature: paymentResponse.razorpay_signature
      })
    });
    
    const data = await response.json();
    if (data.success) {
      showSuccess('Payment successful! Subscription activated.');
      // Refresh user data or redirect
    } else {
      showError('Payment verification failed');
    }
  } catch (error) {
    handleApiError(error);
  }
};
```

---

## Required Frontend Components

### 1. Authentication Components
- Login Form
- Registration Form
- Password Change Form
- Forgot Password Form

### 2. User Dashboard Components
- User Profile
- Subscription Status
- Application History
- Notification Center

### 3. Job Management Components
- Job List/Grid
- Job Search/Filter
- Job Details
- Application Form
- Application Status

### 4. Admin Dashboard Components
- User Management
- Subscription Management
- Job Management
- Analytics Dashboard
- Notification Management

### 5. Payment Components
- Subscription Plans
- Payment Form
- Payment History
- Invoice Management

### 6. Resume Template Components
- Template Gallery
- Template Preview
- Template Download
- Template Management (Admin)

---

## Environment Variables Required

### Backend (.env)
```
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://localhost:27017/notifyx
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d
REFRESH_TOKEN_SECRET=your_refresh_secret
REFRESH_TOKEN_EXPIRE=30d

# Razorpay
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Frontend URLs
FRONTEND_URL=http://localhost:3000
```

### Frontend Environment Variables
```
REACT_APP_API_URL=http://localhost:3001/api/v1
REACT_APP_RAZORPAY_KEY_ID=your_razorpay_key_id
REACT_APP_APP_NAME=X_Career
```

---

## Rate Limiting

The API implements rate limiting:
- General API: 100 requests per 15 minutes
- Authentication endpoints: 5 requests per 15 minutes
- Payment endpoints: 10 requests per 15 minutes

---

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input data |
| 401 | Unauthorized - Invalid or missing token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Duplicate resource |
| 413 | Payload Too Large - Request too large |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |

---

## Success Response Format

All successful responses follow this format:
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

## Error Response Format

All error responses follow this format:
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "details": "Additional error details (optional)"
  },
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

---

This documentation covers all the API endpoints and integration requirements for the X_Career Backend system. The frontend should implement proper error handling, authentication flow, and user experience based on these specifications.
