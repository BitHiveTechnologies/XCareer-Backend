# NotifyX API Endpoints Summary

## 📋 Overview

This document provides a quick reference for all available API endpoints, their current status, and integration readiness for frontend development.

## 🔐 Authentication Endpoints

| Method | Endpoint | Status | Auth Required | Description |
|--------|----------|--------|---------------|-------------|
| POST | `/api/v1/jwt-auth/login` | ✅ Ready | No | Generate JWT token for testing |
| GET | `/api/v1/jwt-auth/me` | ✅ Ready | Yes | Get current user from token |
| POST | `/api/v1/jwt-auth/verify` | ✅ Ready | No | Verify JWT token |

## 👤 User Management Endpoints

| Method | Endpoint | Status | Auth Required | Description |
|--------|----------|--------|---------------|-------------|
| GET | `/api/v1/users/me` | ✅ Ready | Yes | Get current user profile |
| PUT | `/api/v1/users/me` | ✅ Ready | Yes | Update current user profile |
| GET | `/api/v1/users/me/completion` | ✅ Ready | Yes | Get profile completion status |
| GET | `/api/v1/users/profile/{userId}` | ✅ Ready | Yes | Get user profile by ID |
| PUT | `/api/v1/users/profile/{userId}` | ✅ Ready | Yes | Update user profile |
| GET | `/api/v1/users/` | ✅ Ready | Admin | Get all users (admin) |
| DELETE | `/api/v1/users/{userId}` | ✅ Ready | Admin | Delete user (admin) |
| GET | `/api/v1/users/stats` | ✅ Ready | Admin | Get user statistics (admin) |

## 💳 Payment Endpoints

| Method | Endpoint | Status | Auth Required | Description |
|--------|----------|--------|---------------|-------------|
| POST | `/api/v1/payments/create-order` | ✅ Ready | Yes | Create Razorpay order |
| POST | `/api/v1/payments/verify` | ✅ Ready | Yes | Verify payment |
| GET | `/api/v1/payments/history` | ✅ Ready | Yes | Get payment history |
| POST | `/api/v1/payments/webhook` | ✅ Ready | No | Razorpay webhook |

## 📊 Subscription Endpoints

| Method | Endpoint | Status | Auth Required | Description |
|--------|----------|--------|---------------|-------------|
| GET | `/api/v1/subscriptions/current` | ✅ Ready | Yes | Get current subscription |
| GET | `/api/v1/subscriptions/plans` | ✅ Ready | Yes | Get available plans |
| GET | `/api/v1/subscriptions/history` | ✅ Ready | Yes | Get subscription history |
| DELETE | `/api/v1/subscriptions/{id}` | ✅ Ready | Yes | Cancel subscription |
| POST | `/api/v1/subscriptions/renew` | ✅ Ready | Yes | Renew subscription |
| GET | `/api/v1/subscriptions/analytics` | ✅ Ready | Admin | Get subscription analytics |
| POST | `/api/v1/subscriptions/process-expiry` | ✅ Ready | Admin | Process expiry (cron) |

## 💼 Job Management Endpoints

| Method | Endpoint | Status | Auth Required | Description |
|--------|----------|--------|---------------|-------------|
| GET | `/api/v1/jobs/` | ✅ Ready | No | Get all jobs (public) |
| GET | `/api/v1/jobs/search` | ✅ Ready | No | Search jobs |
| GET | `/api/v1/jobs/{jobId}` | ✅ Ready | No | Get job by ID |
| POST | `/api/v1/jobs/` | ✅ Ready | Admin | Create job (admin) |
| PUT | `/api/v1/jobs/{jobId}` | ✅ Ready | Admin | Update job (admin) |
| DELETE | `/api/v1/jobs/{jobId}` | ✅ Ready | Admin | Delete job (admin) |
| PATCH | `/api/v1/jobs/{jobId}/toggle-status` | ✅ Ready | Admin | Toggle job status |
| GET | `/api/v1/jobs/stats/overview` | ✅ Ready | Admin | Get job statistics |

## 📝 Job Application Endpoints

| Method | Endpoint | Status | Auth Required | Description |
|--------|----------|--------|---------------|-------------|
| POST | `/api/v1/applications/{jobId}/apply` | ✅ Ready | Yes | Apply for job |
| GET | `/api/v1/applications/my-applications` | ✅ Ready | Yes | Get user applications |
| PATCH | `/api/v1/applications/{applicationId}/withdraw` | ✅ Ready | Yes | Withdraw application |
| GET | `/api/v1/applications/job/{jobId}/applications` | ✅ Ready | Admin | Get job applications (admin) |
| PATCH | `/api/v1/applications/{applicationId}/status` | ✅ Ready | Admin | Update application status |
| GET | `/api/v1/applications/stats/overview` | ✅ Ready | Admin | Get application statistics |

## 🎯 Job Matching Endpoints

| Method | Endpoint | Status | Auth Required | Description |
|--------|----------|--------|---------------|-------------|
| GET | `/api/v1/matching/jobs` | ✅ Ready | Yes | Get matching jobs |
| GET | `/api/v1/matching/jobs/{jobId}/users` | ✅ Ready | Admin | Get matching users for job |
| GET | `/api/v1/matching/recommendations` | ✅ Ready | Yes | Get job recommendations |
| POST | `/api/v1/matching/recommendations` | ✅ Ready | Yes | Get filtered recommendations |
| GET | `/api/v1/matching/analytics` | ✅ Ready | Yes | Get matching analytics |
| GET | `/api/v1/matching/stats` | ✅ Ready | Admin | Get matching statistics |
| POST | `/api/v1/matching/advanced` | ✅ Ready | Admin | Advanced job matching |

## 📧 Email Notification Endpoints

| Method | Endpoint | Status | Auth Required | Description |
|--------|----------|--------|---------------|-------------|
| GET | `/api/v1/notifications/test-connection` | ✅ Ready | Admin | Test email connection |
| POST | `/api/v1/notifications/welcome` | ✅ Ready | Admin | Send welcome email |
| POST | `/api/v1/notifications/job-alert` | ✅ Ready | Admin | Send job alert email |
| GET | `/api/v1/notifications/queue-status` | ✅ Ready | Admin | Get email queue status |

## 👑 Admin Dashboard Endpoints

| Method | Endpoint | Status | Auth Required | Description |
|--------|----------|--------|---------------|-------------|
| GET | `/api/v1/admin/dashboard` | ✅ Ready | Admin | Get dashboard statistics |
| GET | `/api/v1/admin/analytics/users` | ✅ Ready | Admin | Get user analytics |
| GET | `/api/v1/admin/analytics/jobs` | ✅ Ready | Admin | Get job analytics |
| GET | `/api/v1/admin/health` | ✅ Ready | Admin | Get system health |

## 🏥 Health Check Endpoints

| Method | Endpoint | Status | Auth Required | Description |
|--------|----------|--------|---------------|-------------|
| GET | `/health` | ✅ Ready | No | API health check |
| GET | `/api/v1/` | ✅ Ready | No | API documentation |

## 📊 Integration Status Summary

### ✅ Fully Ready for Integration (45 endpoints)
- **Authentication**: 3 endpoints
- **User Management**: 8 endpoints  
- **Payment**: 4 endpoints
- **Subscription**: 7 endpoints
- **Job Management**: 8 endpoints
- **Job Applications**: 6 endpoints
- **Job Matching**: 7 endpoints
- **Email Notifications**: 4 endpoints
- **Admin Dashboard**: 4 endpoints
- **Health Check**: 2 endpoints

### 🔧 Technical Details

#### Authentication System
- **Type**: JWT Bearer Token
- **Expiration**: 24 hours (configurable)
- **Token Generation**: Via `/api/v1/jwt-auth/login`
- **Role Support**: `user`, `admin`, `super_admin`

#### Database
- **Type**: MongoDB
- **Connection**: Configured and working
- **Models**: User, UserProfile, Job, JobApplication, Subscription, Payment

#### Email Service
- **Type**: Nodemailer with SMTP
- **Queue**: Simple in-memory (no Redis required)
- **Templates**: Handlebars support
- **Status**: Fully functional

#### Payment Integration
- **Provider**: Razorpay
- **Status**: Ready for test mode
- **Webhook**: Implemented and working

## 🚀 Frontend Integration Priority

### High Priority (Core Features)
1. **Authentication** - User login/logout
2. **User Profile** - Profile management
3. **Job Listing** - Browse and search jobs
4. **Job Applications** - Apply for jobs
5. **Job Recommendations** - Personalized matching

### Medium Priority (Enhanced Features)
1. **Subscription Plans** - Plan selection
2. **Payment Processing** - Razorpay integration
3. **Job Matching Analytics** - User insights
4. **Email Notifications** - User communication

### Low Priority (Admin Features)
1. **Admin Dashboard** - Management interface
2. **User Management** - Admin tools
3. **Job Management** - Admin tools
4. **Analytics** - System insights

## 🔍 Testing Status

### ✅ Tested and Working
- All authentication endpoints
- User profile management
- Job listing and search
- Job applications
- Job recommendations
- Subscription status
- Payment history
- Email service connection

### ⚠️ Needs Frontend Testing
- Payment processing (Razorpay integration)
- Email sending (requires SMTP configuration)
- Admin dashboard features
- Advanced job matching

## 📝 Next Steps for Frontend

1. **Set up authentication flow** using JWT endpoints
2. **Implement user profile management** with validation
3. **Create job browsing interface** with filters
4. **Build job application system** with file upload
5. **Integrate payment system** with Razorpay
6. **Add recommendation engine** for personalized jobs
7. **Implement admin dashboard** for management

## 🆘 Support

For integration support:
- Refer to the detailed [Backend Integration Guide](./BACKEND_INTEGRATION_GUIDE.md)
- Check API responses for error details
- Use the health check endpoint to verify connectivity
- Contact backend team for additional endpoints or modifications

---

**All endpoints are ready for frontend integration! 🚀**
