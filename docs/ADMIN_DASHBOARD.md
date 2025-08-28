# Admin Dashboard and Management APIs

## Overview

The NotifyX Admin Dashboard provides comprehensive administrative capabilities for managing users, jobs, subscriptions, and system operations. It includes role-based access control (RBAC), comprehensive analytics, audit logging, and bulk operations.

## Features

### 🔐 Role-Based Access Control
- **Admin**: Can manage users, jobs, and subscriptions with limited privileges
- **Super Admin**: Full system access including role management and sensitive operations

### 📊 Comprehensive Dashboard
- Real-time system statistics
- User analytics and engagement metrics
- Job performance analytics
- Subscription and revenue analytics
- System health monitoring

### 👥 User Management
- View and search all users
- Update user roles and status
- Monitor user activity and engagement
- Bulk user operations
- Soft delete with audit trail

### 💼 Job Management
- Job moderation and approval system
- Bulk job operations
- Application analytics
- Content moderation tools

### 💳 Subscription Management
- Subscription status oversight
- Plan management
- Revenue analytics
- Churn rate monitoring
- Bulk subscription operations

### 📝 Audit Logging
- Complete admin action tracking
- Exportable logs (CSV format)
- Activity filtering and search
- Compliance and security monitoring

## Setup and Configuration

### Prerequisites
- Clerk authentication configured
- MongoDB database running
- Redis for caching (optional)

### Environment Variables
```bash
# Clerk Configuration (already configured)
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_JWT_KEY=your_clerk_jwt_key
CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret

# Admin Configuration
ADMIN_EMAIL_DOMAIN=yourcompany.com  # Optional: restrict admin access to specific domain
ADMIN_IP_WHITELIST=192.168.1.0/24   # Optional: restrict admin access to specific IP ranges
```

### Creating Admin Users
1. **Via Clerk Dashboard**:
   - Create user in Clerk
   - Set custom metadata: `role: "admin"` or `role: "super_admin"`

2. **Via API** (Super Admin only):
   ```bash
   PUT /api/v1/admin/users/:userId
   {
     "role": "admin"
   }
   ```

## API Reference

### Base URL
```
/api/v1/admin
```

### Authentication
All admin endpoints require:
- Valid Clerk JWT token
- User role: `admin` or `super_admin`
- Token in Authorization header: `Bearer <token>`

### Response Format
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Dashboard & Analytics

### Get Dashboard Statistics
```http
GET /api/v1/admin/dashboard/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalUsers": 1250,
      "activeUsers": 980,
      "totalJobs": 456,
      "activeJobs": 234,
      "totalSubscriptions": 890,
      "activeSubscriptions": 756,
      "totalApplications": 2340,
      "pendingApplications": 89
    },
    "monthlyGrowth": {
      "newUsers": 45,
      "newJobs": 23,
      "newSubscriptions": 34
    },
    "distributions": {
      "subscriptionPlans": [
        { "_id": "basic", "count": 450 },
        { "_id": "premium", "count": 320 },
        { "_id": "enterprise", "count": 120 }
      ],
      "userRoles": [
        { "_id": "user", "count": 1200 },
        { "_id": "admin", "count": 45 },
        { "_id": "super_admin", "count": 5 }
      ]
    }
  }
}
```

### Get User Analytics
```http
GET /api/v1/admin/dashboard/user-analytics?period=30d
```

**Query Parameters:**
- `period`: `7d`, `30d`, `90d`, `1y` (default: `30d`)

### Get Job Analytics
```http
GET /api/v1/admin/dashboard/job-analytics
```

### Get System Health
```http
GET /api/v1/admin/dashboard/system-health
```

## User Management

### Get All Users
```http
GET /api/v1/admin/users?page=1&limit=20&search=john&role=user&subscriptionStatus=active
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `search`: Search by email, first name, or last name
- `role`: Filter by user role
- `subscriptionStatus`: Filter by subscription status
- `isProfileComplete`: Filter by profile completion
- `sortBy`: Sort field (default: `createdAt`)
- `sortOrder`: `asc` or `desc` (default: `desc`)

### Get User Details
```http
GET /api/v1/admin/users/:userId
```

### Update User Role
```http
PUT /api/v1/admin/users/:userId
```

**Request Body:**
```json
{
  "role": "admin",
  "isActive": true,
  "subscriptionStatus": "active"
}
```

**Note:** Regular admins can only assign `user` roles. Super admins can assign any role.

### Delete User (Soft Delete)
```http
DELETE /api/v1/admin/users/:userId
```

**Request Body:**
```json
{
  "reason": "Violation of terms of service"
}
```

### Bulk Update Users
```http
POST /api/v1/admin/users/bulk-update
```

**Request Body:**
```json
{
  "userIds": ["userId1", "userId2", "userId3"],
  "updates": {
    "isActive": false,
    "subscriptionStatus": "suspended"
  }
}
```

### Get User Activity
```http
GET /api/v1/admin/users/:userId/activity?period=30d
```

## Job Management

### Get All Jobs
```http
GET /api/v1/admin/jobs?page=1&limit=20&status=pending&type=full-time&location=remote
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `search`: Search by title, company, or description
- `status`: Filter by job status
- `type`: Filter by job type
- `location`: Filter by location
- `isActive`: Filter by active status
- `sortBy`: Sort field (default: `createdAt`)
- `sortOrder`: `asc` or `desc` (default: `desc`)

### Get Job Details
```http
GET /api/v1/admin/jobs/:jobId
```

**Response includes:**
- Job details
- All applications with applicant information

### Update Job Status
```http
PUT /api/v1/admin/jobs/:jobId
```

**Request Body:**
```json
{
  "status": "approved",
  "isActive": true,
  "moderationNotes": "Job meets all requirements",
  "isFeatured": true
}
```

### Delete Job (Soft Delete)
```http
DELETE /api/v1/admin/jobs/:jobId
```

**Request Body:**
```json
{
  "reason": "Inappropriate content"
}
```

### Get Moderation Queue
```http
GET /api/v1/admin/jobs/moderation/queue?status=pending&page=1&limit=20
```

### Get Job Application Analytics
```http
GET /api/v1/admin/jobs/:jobId/applications/analytics
```

## Subscription Management

### Get All Subscriptions
```http
GET /api/v1/admin/subscriptions?page=1&limit=20&status=active&plan=premium
```

### Get Subscription Details
```http
GET /api/v1/admin/subscriptions/:subscriptionId
```

### Update Subscription
```http
PUT /api/v1/admin/subscriptions/:subscriptionId
```

**Request Body:**
```json
{
  "status": "active",
  "plan": "enterprise",
  "startDate": "2024-01-01T00:00:00.000Z",
  "endDate": "2024-12-31T23:59:59.999Z",
  "isActive": true,
  "adminNotes": "Upgraded to enterprise plan"
}
```

### Cancel Subscription
```http
POST /api/v1/admin/subscriptions/:subscriptionId/cancel
```

**Request Body:**
```json
{
  "reason": "Customer request",
  "refundAmount": 99.99
}
```

### Get Subscription Analytics
```http
GET /api/v1/admin/subscriptions/analytics?period=30d
```

### Bulk Update Subscriptions
```http
POST /api/v1/admin/subscriptions/bulk-update
```

**Request Body:**
```json
{
  "subscriptionIds": ["sub1", "sub2", "sub3"],
  "updates": {
    "status": "suspended",
    "isActive": false
  }
}
```

## Audit Logging

### Get Audit Logs
```http
GET /api/v1/admin/audit-logs?page=1&limit=50&adminId=admin123&action=update&resourceType=user
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50, max: 200)
- `adminId`: Filter by admin ID
- `action`: Filter by action type
- `resourceType`: Filter by resource type
- `startDate`: Filter from date (ISO string)
- `endDate`: Filter to date (ISO string)

### Get Recent Activity
```http
GET /api/v1/admin/audit-logs/recent?limit=50
```

### Get Admin Activity
```http
GET /api/v1/admin/audit-logs/admin/:targetAdminId?limit=100
```

### Get Resource Activity
```http
GET /api/v1/admin/audit-logs/resource/:resourceType/:resourceId?limit=100
```

### Export Audit Logs
```http
GET /api/v1/admin/audit-logs/export?adminId=admin123&action=update&startDate=2024-01-01&endDate=2024-01-31
```

**Response:** CSV file download

## Security Features

### Role-Based Access Control
- **Admin**: Can manage users, jobs, and subscriptions
- **Super Admin**: Full system access including role management

### IP Whitelisting (Optional)
```bash
ADMIN_IP_WHITELIST=192.168.1.0/24,10.0.0.0/8
```

### Audit Logging
- All admin actions are logged with timestamps
- IP address and user agent tracking
- Exportable for compliance

### Rate Limiting
- Admin endpoints have stricter rate limiting
- Prevents abuse and brute force attacks

## Error Handling

### Common Error Responses

**403 Forbidden - Admin Access Required**
```json
{
  "success": false,
  "error": {
    "message": "Admin access required"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**403 Forbidden - Insufficient Privileges**
```json
{
  "success": false,
  "error": {
    "message": "Regular admins can only assign user roles"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**404 Not Found**
```json
{
  "success": false,
  "error": {
    "message": "User not found"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**500 Internal Server Error**
```json
{
  "success": false,
  "error": {
    "message": "Failed to get users"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Best Practices

### 1. Security
- Use strong authentication (Clerk)
- Implement IP whitelisting for production
- Regular audit log review
- Monitor admin activity

### 2. Performance
- Use pagination for large datasets
- Implement caching for analytics
- Optimize database queries
- Monitor response times

### 3. Monitoring
- Track admin action patterns
- Monitor system health metrics
- Alert on unusual activity
- Regular backup of audit logs

### 4. Compliance
- Maintain audit trails
- Regular log exports
- Data retention policies
- Privacy compliance

## Testing

### Test Admin Endpoints
```bash
# Test dashboard stats
curl -H "Authorization: Bearer <admin_token>" \
  http://localhost:3000/api/v1/admin/dashboard/stats

# Test user management
curl -H "Authorization: Bearer <admin_token>" \
  http://localhost:3000/api/v1/admin/users?limit=5

# Test audit logs
curl -H "Authorization: Bearer <admin_token>" \
  http://localhost:3000/api/v1/admin/audit-logs/recent
```

### Test Role Restrictions
```bash
# Regular admin trying to assign super_admin role (should fail)
curl -X PUT -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"role": "super_admin"}' \
  http://localhost:3000/api/v1/admin/users/:userId
```

## Troubleshooting

### Common Issues

1. **403 Forbidden Errors**
   - Check user role in Clerk
   - Verify token validity
   - Check IP whitelist if configured

2. **Missing Data in Analytics**
   - Verify database connections
   - Check data aggregation queries
   - Monitor database performance

3. **Audit Log Issues**
   - Check log storage limits
   - Verify logging service
   - Monitor memory usage

4. **Performance Issues**
   - Implement database indexing
   - Use pagination
   - Add caching layer
   - Monitor query performance

### Support

For technical support or questions about the Admin Dashboard:
- Check application logs
- Review audit logs for errors
- Monitor system health endpoints
- Contact system administrator

## Future Enhancements

### Planned Features
- Real-time notifications for admin actions
- Advanced analytics and reporting
- Automated moderation tools
- Enhanced security features
- Mobile admin interface
- Integration with external tools

### Customization
- Configurable dashboard widgets
- Custom admin roles and permissions
- White-label admin interface
- Multi-tenant admin support
