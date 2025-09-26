# Admin Dashboard API Enhancement

## Overview

The Admin Dashboard API Enhancement provides comprehensive administrative controls for managing subscriptions, payments, users, and content within the X Career platform. This enhancement includes advanced analytics, subscription management, payment tracking, and user administration capabilities.

## Features

### 1. Subscription Management
- **Comprehensive Analytics**: Track subscription statistics, plan distribution, and revenue analytics
- **Recent Activity**: Monitor recent subscription activity (last 30 days)
- **Expiring Subscriptions**: Identify subscriptions expiring in the next 7 days
- **Failed Payments**: Track and manage failed payment subscriptions
- **Revenue Analytics**: Daily revenue trends and subscription counts

### 2. Payment Tracking
- **Multi-Period Analytics**: Support for 7d, 30d, 90d, and 1y periods
- **Revenue Analysis**: Total revenue, successful/failed payments tracking
- **Plan-Based Revenue**: Revenue breakdown by subscription plan
- **Payment Trends**: Daily payment success/failure trends
- **Top Customers**: Identify highest-paying customers

### 3. User Management
- **Advanced Filtering**: Search by email, name, subscription status, and role
- **Pagination**: Efficient user listing with pagination support
- **User Statistics**: Track total users, active users, and profile completion rates
- **Registration Trends**: Monitor user registration patterns over time
- **Subscription Updates**: Admin ability to update user subscription status

### 4. Content Management
- **Template Analytics**: Track resume template statistics by subscription tier
- **Popular Templates**: Identify most downloaded templates
- **Category Analysis**: Template distribution by category
- **Recent Activity**: Monitor recent template additions and updates

## API Endpoints

### Subscription Management

#### GET /api/v1/admin/subscriptions
Get comprehensive subscription management data.

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalSubscriptions": 150,
      "activeSubscriptions": 120,
      "cancelledSubscriptions": 15,
      "expiredSubscriptions": 10,
      "failedSubscriptions": 5
    },
    "planDistribution": [
      {
        "_id": "basic",
        "count": 80,
        "totalRevenue": 3920
      },
      {
        "_id": "premium",
        "count": 35,
        "totalRevenue": 3465
      }
    ],
    "recentSubscriptions": [...],
    "revenueAnalytics": [...],
    "expiringSubscriptions": [...],
    "failedPayments": [...]
  }
}
```

### Payment Tracking

#### GET /api/v1/admin/payments?period=30d
Get payment tracking and analytics for specified period.

**Query Parameters:**
- `period`: 7d, 30d, 90d, or 1y (default: 30d)

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "30d",
    "dateRange": {
      "start": "2024-01-01T00:00:00.000Z",
      "end": "2024-01-31T23:59:59.999Z"
    },
    "overview": {
      "totalRevenue": 15000,
      "successfulPayments": 120,
      "failedPayments": 5,
      "pendingPayments": 3
    },
    "revenueByPlan": [...],
    "paymentTrends": [...],
    "topCustomers": [...]
  }
}
```

### User Management

#### GET /api/v1/admin/users
Get user management data with filtering and pagination.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `search`: Search term for email, firstName, lastName
- `subscriptionStatus`: Filter by subscription status
- `role`: Filter by user role

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalUsers": 100,
      "limit": 20
    },
    "statistics": {
      "totalUsers": 100,
      "activeUsers": 80,
      "completedProfiles": 75
    },
    "registrationTrends": [...]
  }
}
```

### Content Management

#### GET /api/v1/admin/content
Get content management data for resume templates.

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalTemplates": 50,
      "basicTemplates": 20,
      "premiumTemplates": 25,
      "enterpriseTemplates": 5
    },
    "analytics": [...],
    "popularTemplates": [...],
    "templateCategories": [...],
    "recentTemplates": [...]
  }
}
```

### User Subscription Management

#### PUT /api/v1/admin/users/:userId/subscription
Update user subscription status (admin action).

**Request Body:**
```json
{
  "subscriptionStatus": "active",
  "subscriptionPlan": "premium",
  "reason": "Admin upgrade"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "user_id",
      "email": "user@example.com",
      "subscriptionStatus": "active",
      "subscriptionPlan": "premium"
    },
    "message": "User subscription updated successfully"
  }
}
```

## Security & Access Control

### Authentication Requirements
- All admin endpoints require valid JWT authentication
- Admin role verification (`admin` or `super_admin`)
- IP logging for audit trails

### Rate Limiting
- Standard rate limiting applies to all admin endpoints
- Enhanced monitoring for admin actions

### Audit Logging
- All admin actions are logged with:
  - Admin user ID and role
  - Target user/entity ID
  - Action performed
  - Timestamp
  - IP address

## Error Handling

### Common Error Responses

#### 403 Forbidden
```json
{
  "success": false,
  "error": {
    "message": "Admin access required"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### 404 Not Found
```json
{
  "success": false,
  "error": {
    "message": "User not found"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### 400 Bad Request
```json
{
  "success": false,
  "error": {
    "message": "User ID and subscription status are required"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Testing

### Test Script
Run the comprehensive test script:
```bash
npm run test:admin-dashboard
```

### Test Coverage
- Authentication and authorization
- Subscription management analytics
- Payment tracking across multiple periods
- User management with filtering
- Content management analytics
- User subscription updates
- Integration testing for all endpoints

## Performance Considerations

### Database Optimization
- Efficient aggregation pipelines for analytics
- Proper indexing on frequently queried fields
- Pagination for large datasets

### Caching Strategy
- Consider caching for frequently accessed analytics
- Cache invalidation on data updates

### Monitoring
- Monitor query performance for analytics endpoints
- Track admin action frequency and patterns

## Future Enhancements

### Planned Features
- Real-time dashboard updates
- Advanced filtering and search capabilities
- Export functionality for reports
- Automated alerts for critical metrics
- Integration with external analytics tools

### Scalability Considerations
- Consider read replicas for analytics queries
- Implement data archiving for historical data
- Optimize aggregation pipelines for large datasets

## Usage Examples

### Get Subscription Overview
```bash
curl -X GET "http://localhost:3001/api/v1/admin/subscriptions" \
  -H "Authorization: Bearer <admin_token>"
```

### Update User Subscription
```bash
curl -X PUT "http://localhost:3001/api/v1/admin/users/user_id/subscription" \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "subscriptionStatus": "active",
    "subscriptionPlan": "premium",
    "reason": "Customer support upgrade"
  }'
```

### Get Payment Analytics
```bash
curl -X GET "http://localhost:3001/api/v1/admin/payments?period=90d" \
  -H "Authorization: Bearer <admin_token>"
```

## Conclusion

The Admin Dashboard API Enhancement provides comprehensive administrative capabilities for managing the X Career platform. With advanced analytics, subscription management, payment tracking, and user administration features, administrators can effectively monitor and manage the platform's growth and user engagement.

The API is designed with security, performance, and scalability in mind, providing a solid foundation for administrative operations while maintaining audit trails and proper access controls.
