# Clerk Authentication Integration

This document describes the integration of Clerk authentication service with the NotifyX backend.

## Overview

We've migrated from a custom JWT-based authentication system to Clerk, which provides:
- Secure user authentication and management
- Built-in admin roles and permissions
- Webhook-based user lifecycle management
- Better security and scalability

## Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# Clerk Configuration
CLERK_SECRET_KEY=your-clerk-secret-key
CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
CLERK_JWT_KEY=your-clerk-jwt-key
CLERK_WEBHOOK_SECRET=your-clerk-webhook-secret
CLERK_API_URL=https://api.clerk.com
CLERK_FRONTEND_API=https://clerk.your-domain.com
```

### Getting Clerk Keys

1. Sign up at [clerk.com](https://clerk.com)
2. Create a new application
3. Go to API Keys in your dashboard
4. Copy the required keys

## API Endpoints

### Clerk Authentication Routes

- `POST /api/v1/clerk-auth/webhook` - Clerk webhook endpoint
- `GET /api/v1/clerk-auth/me` - Get current user profile
- `PUT /api/v1/clerk-auth/profile` - Update user profile
- `GET /api/v1/clerk-auth/admin` - Admin-only endpoint
- `GET /api/v1/clerk-auth/super-admin` - Super admin endpoint

### Legacy JWT Routes (Deprecated)

The old JWT-based routes are still available at `/api/v1/auth/*` but will be removed in future versions.

## Middleware

### `authenticate`
Verifies Clerk session tokens and populates `req.user` with user information.

### `requireAdmin`
Ensures the authenticated user has admin or super admin role.

### `requireSuperAdmin`
Ensures the authenticated user has super admin role only.

### `optionalAuth`
Populates user information if a valid token is provided, but doesn't fail if missing.

## User Roles

- **user**: Regular user with basic access
- **admin**: Admin user with elevated permissions
- **super_admin**: Super admin with full system access

Roles are managed through Clerk's public metadata and synced via webhooks.

## Webhook Integration

Clerk sends webhooks for user lifecycle events:
- `user.created` - New user registration
- `user.updated` - User profile updates
- `user.deleted` - User account deletion

These webhooks automatically sync user data with the local database.

## Database Changes

### User Model Updates

- Added `clerkUserId` field for external auth reference
- Made `password` field optional (for Clerk users)
- Added `role` field for access control
- Added indexes for performance

### Migration Notes

Existing users will continue to work with the old JWT system. New users created through Clerk will have the new structure.

## Frontend Integration

### Authentication Flow

1. User signs up/logs in through Clerk frontend
2. Clerk provides a session token
3. Frontend includes token in `Authorization: Bearer <token>` header
4. Backend verifies token and provides access

### Example Request

```javascript
const response = await fetch('/api/v1/clerk-auth/me', {
  headers: {
    'Authorization': `Bearer ${clerkSessionToken}`,
    'Content-Type': 'application/json'
  }
});
```

## Security Features

- Webhook signature verification
- Role-based access control
- Secure token validation
- Automatic user data synchronization

## Testing

### Admin Access Test

```bash
# Test admin access (requires admin role)
curl -H "Authorization: Bearer <token>" \
  http://localhost:5000/api/v1/clerk-auth/admin

# Test super admin access (requires super_admin role)
curl -H "Authorization: Bearer <token>" \
  http://localhost:5000/api/v1/clerk-auth/super-admin
```

### Profile Update Test

```bash
curl -X PUT \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"mobile": "9876543210", "qualification": "B.Tech"}' \
  http://localhost:5000/api/v1/clerk-auth/profile
```

## Troubleshooting

### Common Issues

1. **Invalid webhook signature**: Check `CLERK_WEBHOOK_SECRET`
2. **Authentication failed**: Verify `CLERK_SECRET_KEY` and `CLERK_JWT_KEY`
3. **User not found**: Ensure webhook is properly configured in Clerk dashboard

### Debug Mode

Set `LOG_LEVEL=debug` to see detailed authentication logs.

## Future Enhancements

- [ ] Remove legacy JWT system
- [ ] Add more granular permissions
- [ ] Implement user invitation system
- [ ] Add audit logging for admin actions
