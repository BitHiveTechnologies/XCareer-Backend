# User Provisioning System Documentation

## Overview

The User Provisioning System is a comprehensive automated system that handles user creation, profile setup, subscription management, and integration with external systems. It provides a unified interface for provisioning users from various sources including payment webhooks, external authentication systems, and bulk imports.

## Features

### Core Functionality
- **Automated User Creation**: Create users with complete profile setup
- **Subscription Management**: Automatic subscription activation and management
- **Profile Creation**: Automated user profile creation with default values
- **External System Integration**: Support for Razorpay, Clerk, and CSV imports
- **Bulk Operations**: Process multiple users simultaneously
- **Statistics and Monitoring**: Track provisioning metrics and success rates

### Supported Sources
- **Payment Webhooks**: Automatic user provisioning from successful payments
- **Clerk Authentication**: Integration with Clerk user management
- **CSV Import**: Bulk user import from CSV files
- **Manual Provisioning**: Admin-initiated user creation

## API Endpoints

### Base URL
```
/api/v1/provisioning
```

### Authentication
All endpoints require admin authentication:
```bash
Authorization: Bearer <admin_token>
```

### Endpoints

#### 1. Provision Single User
```http
POST /api/v1/provisioning/user
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "mobile": "9876543210",
  "clerkUserId": "clerk_123", // Optional
  "subscriptionPlan": "premium", // basic, premium, enterprise
  "subscriptionStatus": "active", // active, inactive, expired
  "profileData": {
    "firstName": "John",
    "lastName": "Doe",
    "qualification": "B.Tech",
    "stream": "CSE",
    "yearOfPassout": 2023,
    "cgpaOrPercentage": 8.5,
    "collegeName": "Example College",
    "dateOfBirth": "1995-01-01"
  },
  "metadata": {
    "source": "manual_provisioning",
    "campaign": "admin_created",
    "referrer": "website",
    "notes": "Admin created user"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "User provisioned successfully",
  "data": {
    "user": { /* User object */ },
    "profile": { /* Profile object */ },
    "subscription": { /* Subscription object */ },
    "warnings": ["User already exists, updating existing user"]
  }
}
```

#### 2. Bulk Provision Users
```http
POST /api/v1/provisioning/bulk
```

**Request Body:**
```json
{
  "users": [
    {
      "email": "user1@example.com",
      "name": "User One",
      "subscriptionPlan": "basic"
    },
    {
      "email": "user2@example.com",
      "name": "User Two",
      "subscriptionPlan": "premium"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Bulk provisioning completed",
  "data": {
    "total": 2,
    "successful": 2,
    "failed": 0,
    "results": [ /* Array of provisioning results */ ]
  }
}
```

#### 3. Get Provisioning Statistics
```http
GET /api/v1/provisioning/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalUsers": 150,
    "activeSubscriptions": 120,
    "usersWithProfiles": 140,
    "recentProvisioned": 5,
    "profileCompletionRate": 93.33,
    "subscriptionRate": 80.0
  }
}
```

#### 4. External System Integration
```http
POST /api/v1/provisioning/external
```

**Request Body (Razorpay):**
```json
{
  "source": "razorpay",
  "data": {
    "customer": {
      "email": "user@example.com",
      "name": "John Doe",
      "contact": "9876543210"
    },
    "payment_id": "pay_123456789",
    "amount": 9900,
    "plan": "premium"
  }
}
```

**Request Body (Clerk):**
```json
{
  "source": "clerk",
  "data": {
    "id": "clerk_123456789",
    "email_addresses": [
      { "email_address": "user@example.com" }
    ],
    "first_name": "John",
    "last_name": "Doe"
  }
}
```

**Request Body (CSV Import):**
```json
{
  "source": "csv_import",
  "data": {
    "email": "user@example.com",
    "name": "John Doe",
    "mobile": "9876543210",
    "firstName": "John",
    "lastName": "Doe",
    "qualification": "B.Tech",
    "stream": "CSE",
    "yearOfPassout": 2023,
    "cgpaOrPercentage": 8.5,
    "collegeName": "Example College",
    "subscriptionPlan": "premium",
    "subscriptionStatus": "active"
  }
}
```

#### 5. Test Provisioning
```http
POST /api/v1/provisioning/test
```

**Response:**
```json
{
  "success": true,
  "message": "Test provisioning successful",
  "data": {
    "user": { /* Test user object */ },
    "profile": { /* Test profile object */ },
    "subscription": { /* Test subscription object */ }
  }
}
```

## User Provisioning Service

### Core Service Methods

#### `provisionUser(data: UserProvisioningData): Promise<ProvisioningResult>`
Main method for provisioning a single user with complete setup.

#### `bulkProvisionUsers(usersData: UserProvisioningData[]): Promise<ProvisioningResult[]>`
Process multiple users in batch operations.

#### `provisionFromPaymentWebhook(paymentData: any): Promise<ProvisioningResult>`
Automated provisioning from payment webhook events.

#### `getProvisioningStats(): Promise<any>`
Get comprehensive provisioning statistics and metrics.

### Data Structures

#### UserProvisioningData
```typescript
interface UserProvisioningData {
  email: string;
  name: string;
  mobile?: string;
  clerkUserId?: string;
  subscriptionPlan?: 'basic' | 'premium' | 'enterprise';
  subscriptionStatus?: 'active' | 'inactive' | 'expired';
  profileData?: {
    firstName?: string;
    lastName?: string;
    qualification?: string;
    stream?: string;
    yearOfPassout?: number;
    cgpaOrPercentage?: number;
    collegeName?: string;
    dateOfBirth?: Date;
  };
  metadata?: {
    source?: string;
    campaign?: string;
    referrer?: string;
    notes?: string;
  };
}
```

#### ProvisioningResult
```typescript
interface ProvisioningResult {
  success: boolean;
  user?: any;
  profile?: any;
  subscription?: any;
  errors?: string[];
  warnings?: string[];
}
```

## Integration Points

### Payment Webhook Integration
The system automatically integrates with payment webhooks to provision users when payments are successful:

```typescript
// In paymentController.ts
async function handleSubscriptionCharged(payload: any): Promise<void> {
  const result = await UserProvisioningService.provisionFromPaymentWebhook(payload);
  // Handle result...
}
```

### External System Support

#### Razorpay Integration
- Automatic user creation from payment events
- Plan determination based on payment amount
- Subscription activation

#### Clerk Integration
- User creation from Clerk authentication events
- Profile setup with default values
- Basic subscription assignment

#### CSV Import
- Bulk user import from CSV files
- Profile data mapping
- Subscription plan assignment

## Error Handling

### Common Error Scenarios
1. **User Already Exists**: System updates existing user instead of creating new one
2. **Invalid Data**: Validation errors with detailed messages
3. **External System Failures**: Graceful handling of external service errors
4. **Database Errors**: Transaction rollback and error logging

### Error Response Format
```json
{
  "success": false,
  "error": {
    "message": "User provisioning failed",
    "details": ["Email is required", "Name is required"]
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Security Considerations

### Authentication
- All endpoints require admin authentication
- JWT token validation
- Role-based access control

### Data Validation
- Input sanitization
- Email format validation
- Mobile number validation
- Subscription plan validation

### Audit Logging
- All provisioning actions are logged
- User creation tracking
- Error logging and monitoring

## Monitoring and Statistics

### Key Metrics
- Total users provisioned
- Success/failure rates
- Profile completion rates
- Subscription activation rates
- Recent provisioning activity

### Dashboard Integration
The system provides comprehensive statistics for admin dashboards:
- Real-time provisioning metrics
- User growth tracking
- Subscription analytics
- Error rate monitoring

## Testing

### Test Suite
Run the comprehensive test suite:
```bash
npx ts-node scripts/testUserProvisioning.ts
```

### Test Coverage
- Single user provisioning
- Bulk user provisioning
- External system integration
- Error handling
- Validation
- Authentication
- Statistics retrieval

## Deployment Considerations

### Environment Variables
Ensure the following environment variables are configured:
- Database connection strings
- External service API keys
- Email service configuration
- Logging configuration

### Database Indexes
The system creates optimized indexes for:
- User email lookups
- Subscription status queries
- Profile completion tracking
- Recent activity monitoring

### Performance Optimization
- Bulk operation limits (max 100 users)
- Database connection pooling
- Async processing for large batches
- Error recovery mechanisms

## Future Enhancements

### Planned Features
- Email service integration for welcome emails
- Advanced user matching algorithms
- Custom provisioning workflows
- Real-time provisioning notifications
- Advanced analytics and reporting

### Integration Roadmap
- Additional external authentication providers
- CRM system integration
- Marketing automation platform integration
- Advanced subscription management features
