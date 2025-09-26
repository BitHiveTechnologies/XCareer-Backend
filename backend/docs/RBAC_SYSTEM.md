# Role-Based Access Control (RBAC) System Documentation

## Overview

The RBAC system provides comprehensive role-based access control for the NotifyX platform, managing permissions based on user roles and subscription tiers.

## Features

### 1. Role-Based Permissions
- **Super Admin**: Full access to all resources and actions
- **Admin**: Access to user management, subscriptions, payments, analytics, jobs, notifications, templates, and provisioning
- **User**: Access to profile, subscriptions (read/update), jobs (read/apply), and notifications (read/update)

### 2. Subscription-Based Permissions
- **Basic Plan**: Limited job access (10 jobs), basic profile management, notifications
- **Premium Plan**: Enhanced job access (50 jobs), analytics, templates, priority support
- **Enterprise Plan**: Unlimited access to all features, advanced analytics, custom templates, dedicated support

### 3. Permission System
- **Resource-based**: Permissions are tied to specific resources (users, jobs, analytics, etc.)
- **Action-based**: Each resource has specific actions (read, write, delete, etc.)
- **Conditional**: Permissions can have conditions (limits, scopes, etc.)

## Architecture

### Core Components

#### 1. RBACService (`src/services/rbacService.ts`)
- Central service for permission management
- Defines roles, permissions, and subscription-based access
- Provides utility methods for permission checking

#### 2. RBAC Middleware (`src/middleware/rbacMiddleware.ts`)
- Express middleware for permission enforcement
- Role-based access control
- Subscription-based access control
- Resource ownership validation

#### 3. RBAC Controller (`src/controllers/rbacController.ts`)
- API endpoints for permission management
- User permission retrieval
- Permission validation
- Role and permission listing

#### 4. RBAC Routes (`src/routes/rbacRoutes.ts`)
- RESTful API endpoints for RBAC operations
- Authentication and validation middleware
- Admin-only endpoints

## API Endpoints

### Authentication Required
All RBAC endpoints require authentication via JWT token.

### 1. Get User Permissions
```
GET /api/v1/rbac/permissions
```
Returns current user's permissions, capabilities, and subscription limits.

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "role": "user",
      "subscriptionPlan": "premium",
      "subscriptionStatus": "active"
    },
    "permissions": [...],
    "limits": {...},
    "capabilities": {
      "isAdmin": false,
      "hasActiveSubscription": true,
      "canAccessPremiumFeatures": true,
      "canAccessEnterpriseFeatures": false
    }
  }
}
```

### 2. Check Specific Permission
```
POST /api/v1/rbac/check-permission
```
Checks if user has permission for specific resource and action.

**Request:**
```json
{
  "resource": "jobs",
  "action": "read",
  "conditions": {}
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "hasPermission": true,
    "validation": {
      "allowed": true,
      "reason": null
    }
  }
}
```

### 3. Get Roles and Permissions (Admin Only)
```
GET /api/v1/rbac/roles
```
Returns all available roles and permissions (admin access required).

### 4. Get Subscription Limits
```
GET /api/v1/rbac/limits
```
Returns user's subscription-based limits.

### 5. Validate Access
```
POST /api/v1/rbac/validate-access
```
Validates user access to specific resource with detailed validation.

## Permission Structure

### Roles

#### Super Admin
- **Permissions**: Full access to all resources (`*`) and actions (`*`)
- **Use Case**: System administration, user management, platform configuration

#### Admin
- **Permissions**: 
  - Users: Full access
  - Subscriptions: Full access
  - Payments: Full access
  - Analytics: Full access
  - Jobs: Full access
  - Notifications: Full access
  - Templates: Full access
  - Provisioning: Full access
- **Use Case**: Customer support, subscription management, analytics

#### User
- **Permissions**:
  - Profile: Full access
  - Subscriptions: Read and update
  - Jobs: Read and apply
  - Notifications: Read and update
- **Use Case**: Regular users, job seekers

### Subscription Permissions

#### Basic Plan
- **Job Access**: Limited to 10 job applications
- **Profile**: Full access
- **Notifications**: Read and update
- **Analytics**: None

#### Premium Plan
- **Job Access**: Up to 50 job applications
- **Profile**: Full access
- **Notifications**: Full access
- **Analytics**: Personal analytics
- **Templates**: Access to resume templates

#### Enterprise Plan
- **Job Access**: Unlimited
- **Profile**: Full access
- **Notifications**: Full access
- **Analytics**: Full analytics access
- **Templates**: Full template access
- **Priority Support**: Dedicated support

## Middleware Usage

### 1. Permission-Based Access
```typescript
import { requirePermission } from '../middleware/rbacMiddleware';

// Require specific permission
router.get('/jobs', authenticate, requirePermission('jobs', 'read'), getJobs);
```

### 2. Role-Based Access
```typescript
import { requireAdminPermission } from '../middleware/rbacMiddleware';

// Require admin role
router.get('/admin/users', authenticate, requireAdminPermission, getUsers);
```

### 3. Subscription-Based Access
```typescript
import { requireActiveSubscription, requirePremiumAccess } from '../middleware/rbacMiddleware';

// Require active subscription
router.get('/analytics', authenticate, requireActiveSubscription, getAnalytics);

// Require premium subscription
router.get('/templates', authenticate, requirePremiumAccess, getTemplates);
```

### 4. Resource Ownership
```typescript
import { requireResourceOwnership } from '../middleware/rbacMiddleware';

// Require resource ownership
router.get('/profile/:id', authenticate, requireResourceOwnership('id'), getProfile);
```

## Integration with Existing Systems

### 1. Authentication Integration
- Works with JWT authentication middleware
- Integrates with Clerk authentication
- Supports both user and admin authentication

### 2. Subscription Integration
- Reads subscription data from User model
- Validates subscription status
- Enforces subscription-based limits

### 3. User Model Integration
- Uses User model for role and subscription data
- Validates user status and activity
- Supports metadata-based permissions

## Security Considerations

### 1. Permission Validation
- All permissions are validated server-side
- No client-side permission enforcement
- Comprehensive error handling

### 2. Role Escalation Prevention
- Users cannot escalate their own roles
- Admin actions require proper authentication
- Audit logging for permission changes

### 3. Subscription Validation
- Subscription status is validated for each request
- Expired subscriptions are handled gracefully
- Upgrade/downgrade scenarios are supported

## Testing

### Test Coverage
- Permission checking
- Role validation
- Subscription limits
- Error handling
- Unauthorized access
- Admin-only endpoints

### Test Script
Run the comprehensive test suite:
```bash
npx ts-node scripts/testRBACSystem.ts
```

## Configuration

### Environment Variables
- No additional environment variables required
- Uses existing JWT and database configuration

### Database Requirements
- User model with role and subscription fields
- Subscription model for subscription data
- Proper indexing for performance

## Performance Considerations

### 1. Permission Caching
- Permissions are calculated on-demand
- Consider caching for high-traffic scenarios
- Database queries are optimized

### 2. Middleware Efficiency
- Minimal database queries per request
- Efficient permission checking
- Proper error handling

## Future Enhancements

### 1. Dynamic Permissions
- Database-driven permission management
- Runtime permission updates
- Custom permission sets

### 2. Advanced Features
- Permission inheritance
- Conditional permissions
- Time-based access control

### 3. Analytics
- Permission usage tracking
- Access pattern analysis
- Security audit logs

## Troubleshooting

### Common Issues

#### 1. Permission Denied Errors
- Check user role and subscription status
- Verify resource and action parameters
- Review subscription limits

#### 2. Authentication Issues
- Ensure valid JWT token
- Check token expiration
- Verify user status

#### 3. Subscription Issues
- Validate subscription status
- Check subscription plan
- Review subscription limits

### Debug Information
- Enable debug logging for permission checks
- Review middleware execution order
- Check database user and subscription data
