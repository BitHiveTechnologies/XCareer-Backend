# Subscription API Documentation

This document provides comprehensive information about the Subscription API endpoints, including available plans, pricing, and management features.

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Available Subscription Plans](#available-subscription-plans)
- [API Endpoints](#api-endpoints)
- [Response Examples](#response-examples)
- [Error Handling](#error-handling)
- [Usage Examples](#usage-examples)

## Overview

The Subscription API allows users to:
- View available subscription plans
- Check their current subscription status
- View subscription history
- Manage subscription lifecycle

## Authentication

All subscription endpoints require JWT authentication. Include the token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

### Getting a JWT Token

```http
POST /api/v1/jwt-auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "role": "user",
  "firstName": "John",
  "lastName": "Doe"
}
```

## Available Subscription Plans

The system offers three subscription tiers:

### 1. Free Plan
- **Price**: ₹0/forever
- **Duration**: Unlimited
- **Features**:
  - Basic job alerts
  - Weekly newsletter
  - Community access
  - Basic resources
- **Max Jobs**: 10
- **Priority**: Low

### 2. NotifyX Premium (Most Popular)
- **Price**: ₹49/month
- **Duration**: 30 days
- **Features**:
  - Priority job alerts
  - Instant notifications
  - Personalized matching
  - Exclusive content
  - Resume review
  - Interview prep calls
- **Max Jobs**: 100
- **Priority**: Medium

### 3. NotifyX Pro
- **Price**: ₹99/month
- **Duration**: 30 days
- **Features**:
  - Everything in Premium
  - 1-on-1 career coaching
  - LinkedIn optimization
  - Salary negotiation help
  - Direct recruiter connect
  - Custom job search strategy
- **Max Jobs**: 500
- **Priority**: High

## API Endpoints

### 1. Get Available Subscription Plans

```http
GET /api/v1/subscriptions/plans
```

**Description**: Retrieves all available subscription plans with their features and pricing. **This endpoint is public and does not require authentication.**

**Response:**
```json
{
  "success": true,
  "data": {
    "plans": [
      {
        "id": "basic",
        "name": "Free",
        "price": 0,
        "duration": 999999,
        "features": [
          "Basic job alerts",
          "Weekly newsletter",
          "Community access",
          "Basic resources"
        ],
        "maxJobs": 10,
        "priority": "low"
      },
      {
        "id": "premium",
        "name": "NotifyX Premium",
        "price": 49,
        "duration": 30,
        "features": [
          "Priority job alerts",
          "Instant notifications",
          "Personalized matching",
          "Exclusive content",
          "Resume review",
          "Interview prep calls"
        ],
        "maxJobs": 100,
        "priority": "medium"
      },
      {
        "id": "enterprise",
        "name": "NotifyX Pro",
        "price": 99,
        "duration": 30,
        "features": [
          "Everything in Premium",
          "1-on-1 career coaching",
          "LinkedIn optimization",
          "Salary negotiation help",
          "Direct recruiter connect",
          "Custom job search strategy"
        ],
        "maxJobs": 500,
        "priority": "high"
      }
    ]
  },
  "timestamp": "2025-09-23T12:54:39.907Z"
}
```

### 2. Get Current User Subscription

```http
GET /api/v1/subscriptions/current
Authorization: Bearer <token>
```

**Description**: Retrieves the user's current active subscription details. **Requires user JWT authentication.**

**Response (Active Subscription):**
```json
{
  "success": true,
  "data": {
    "subscription": {
      "id": "subscription_id",
      "plan": "premium",
      "planDetails": {
        "id": "premium",
        "name": "Premium Plan",
        "price": 99,
        "duration": 90,
        "features": [
          "All Basic features",
          "Priority job matching",
          "Advanced analytics",
          "Resume builder tools"
        ],
        "maxJobs": 200,
        "priority": "medium"
      },
      "status": "completed",
      "startDate": "2024-01-01T00:00:00.000Z",
      "endDate": "2024-04-01T00:00:00.000Z",
      "amount": 99,
      "daysRemaining": 45,
      "isActive": true
    }
  },
  "timestamp": "2025-09-23T12:01:45.309Z"
}
```

**Response (No Active Subscription):**
```json
{
  "success": false,
  "error": {
    "message": "No active subscription found"
  },
  "timestamp": "2025-09-23T12:01:49.627Z"
}
```

### 3. Get Subscription History

```http
GET /api/v1/subscriptions/history?page=1&limit=10&status=completed
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of records per page (default: 10)
- `status` (optional): Filter by subscription status (`completed`, `cancelled`, `expired`)

**Response:**
```json
{
  "success": true,
  "data": {
    "subscriptions": [
      {
        "id": "subscription_id_1",
        "plan": "premium",
        "status": "completed",
        "startDate": "2024-01-01T00:00:00.000Z",
        "endDate": "2024-04-01T00:00:00.000Z",
        "amount": 99,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalRecords": 1,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  },
  "timestamp": "2025-09-23T12:01:45.309Z"
}
```

### 4. Cancel Subscription

```http
POST /api/v1/subscriptions/cancel
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "No longer needed"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Subscription cancelled successfully",
  "data": {
    "subscription": {
      "id": "subscription_id",
      "status": "cancelled",
      "cancelledAt": "2025-09-23T12:01:45.309Z",
      "reason": "No longer needed"
    }
  },
  "timestamp": "2025-09-23T12:01:45.309Z"
}
```

### 5. Renew Subscription

```http
POST /api/v1/subscriptions/renew
Authorization: Bearer <token>
Content-Type: application/json

{
  "plan": "premium"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Subscription renewed successfully",
  "data": {
    "subscription": {
      "id": "new_subscription_id",
      "plan": "premium",
      "status": "pending",
      "startDate": "2025-09-23T12:01:45.309Z",
      "endDate": "2025-12-23T12:01:45.309Z",
      "amount": 99
    }
  },
  "timestamp": "2025-09-23T12:01:45.309Z"
}
```

### 6. Update Subscription Plan (Admin Only)

```http
PUT /api/v1/subscriptions/plans/:planId
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "Updated Plan Name",
  "price": 99,
  "duration": 30,
  "features": ["Feature 1", "Feature 2"],
  "maxJobs": 100,
  "priority": "medium"
}
```

**Description**: Updates subscription plan details. **Requires admin authentication.**

**Path Parameters:**
- `planId` (required): Plan ID (`basic`, `premium`, or `enterprise`)

**Request Body (all fields optional):**
- `name` (string): Plan name
- `price` (number): Plan price in INR
- `duration` (number): Plan duration in days
- `features` (array): List of plan features
- `maxJobs` (number): Maximum jobs allowed
- `priority` (string): Priority level (`low`, `medium`, `high`)

**Response:**
```json
{
  "success": true,
  "message": "Subscription plan updated successfully",
  "data": {
    "plan": {
      "id": "basic",
      "name": "Updated Basic Plan",
      "price": 59,
      "duration": 30,
      "features": [
        "Access to basic job listings",
        "Email notifications",
        "Basic profile management"
      ],
      "maxJobs": 50,
      "priority": "low"
    }
  },
  "timestamp": "2025-09-23T12:15:46.570Z"
}
```

### 7. Get Subscription Analytics (Admin Only)

```http
GET /api/v1/subscriptions/analytics
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalSubscriptions": 150,
    "activeSubscriptions": 120,
    "revenue": {
      "total": 15000,
      "monthly": 5000,
      "currency": "INR"
    },
    "planDistribution": {
      "basic": 30,
      "premium": 80,
      "enterprise": 10
    },
    "churnRate": 5.2,
    "averageRevenuePerUser": 100
  },
  "timestamp": "2025-09-23T12:01:45.309Z"
}
```

## Response Examples

### Complete Subscription Plan Response

```json
{
  "success": true,
  "data": {
    "plans": [
      {
        "id": "basic",
        "name": "Free",
        "price": 0,
        "duration": 999999,
        "features": [
          "Basic job alerts",
          "Weekly newsletter",
          "Community access",
          "Basic resources"
        ],
        "maxJobs": 10,
        "priority": "low"
      },
      {
        "id": "premium",
        "name": "NotifyX Premium",
        "price": 49,
        "duration": 30,
        "features": [
          "Priority job alerts",
          "Instant notifications",
          "Personalized matching",
          "Exclusive content",
          "Resume review",
          "Interview prep calls"
        ],
        "maxJobs": 100,
        "priority": "medium"
      },
      {
        "id": "enterprise",
        "name": "NotifyX Pro",
        "price": 99,
        "duration": 30,
        "features": [
          "Everything in Premium",
          "1-on-1 career coaching",
          "LinkedIn optimization",
          "Salary negotiation help",
          "Direct recruiter connect",
          "Custom job search strategy"
        ],
        "maxJobs": 500,
        "priority": "high"
      }
    ]
  },
  "timestamp": "2025-09-23T12:54:39.907Z"
}
```

## Error Handling

### Common Error Responses

#### 401 Unauthorized
```json
{
  "success": false,
  "error": {
    "message": "Authorization header with Bearer token is required"
  },
  "timestamp": "2025-09-23T12:01:45.309Z"
}
```

#### 404 Not Found
```json
{
  "success": false,
  "error": {
    "message": "No active subscription found"
  },
  "timestamp": "2025-09-23T12:01:49.627Z"
}
```

#### 400 Bad Request
```json
{
  "success": false,
  "error": {
    "message": "Invalid subscription plan"
  },
  "timestamp": "2025-09-23T12:01:45.309Z"
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "error": {
    "message": "Failed to get subscription history"
  },
  "timestamp": "2025-09-23T12:01:52.451Z"
}
```

## Usage Examples

### Complete Subscription Flow

1. **Login to get JWT token:**
```bash
curl -X POST http://localhost:3001/api/v1/jwt-auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "role": "user",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

2. **Get available subscription plans (public endpoint):**
```bash
curl -X GET http://localhost:3001/api/v1/subscriptions/plans
```

3. **Check current subscription:**
```bash
curl -X GET http://localhost:3001/api/v1/subscriptions/current \
  -H "Authorization: Bearer <token>"
```

4. **View subscription history:**
```bash
curl -X GET http://localhost:3001/api/v1/subscriptions/history \
  -H "Authorization: Bearer <token>"
```

5. **Cancel subscription:**
```bash
curl -X POST http://localhost:3001/api/v1/subscriptions/cancel \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "No longer needed"
  }'
```

6. **Renew subscription:**
```bash
curl -X POST http://localhost:3001/api/v1/subscriptions/renew \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "plan": "premium"
  }'
```

7. **Update subscription plan (Admin only):**
```bash
curl -X PUT http://localhost:3001/api/v1/subscriptions/plans/basic \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Basic Plan",
    "price": 59
  }'
```

## Subscription Status Values

- `pending`: Subscription is being processed
- `completed`: Active subscription
- `cancelled`: User cancelled the subscription
- `expired`: Subscription has expired
- `failed`: Payment failed

## Plan Priority Levels

- `low`: Basic plan features
- `medium`: Premium plan features
- `high`: Enterprise plan features

## Notes

- All prices are in Indian Rupees (INR)
- Duration is specified in days
- Max jobs refers to the maximum number of job applications allowed per subscription period
- Priority affects job matching and notification delivery
- Subscription renewals are processed automatically
- Cancelled subscriptions cannot be reactivated (new subscription required)
- All timestamps are in ISO 8601 format
- User IDs are MongoDB ObjectIds

## Integration with Payment System

The subscription system integrates with Razorpay for payment processing:

- Payment orders are created via `/api/v1/payments/create-order`
- Payment verification is handled via `/api/v1/payments/verify`
- Subscription activation occurs after successful payment verification

## Support

For subscription-related support or questions, please contact the development team or refer to the main API documentation.
