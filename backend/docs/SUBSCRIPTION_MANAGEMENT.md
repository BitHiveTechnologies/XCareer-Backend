# Subscription Management System

This document describes the subscription management system implementation for the NotifyX Backend.

## Overview

The subscription management system handles the complete lifecycle of user subscriptions, including plan management, renewal processing, expiry handling, and analytics.

## Features

- **Subscription Lifecycle Management**: Complete subscription lifecycle from creation to expiry
- **Plan Management**: Multiple subscription plans with different features and pricing
- **Automatic Renewal**: Support for subscription renewals and upgrades
- **Expiry Handling**: Automatic processing of expired subscriptions
- **Analytics & Reporting**: Comprehensive subscription analytics and metrics
- **Status Tracking**: Real-time subscription status monitoring
- **Plan Changes**: Support for plan upgrades and downgrades

## Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Frontend  │───▶│   Backend   │───▶│  Database   │
│             │    │             │    │             │
└─────────────┘    └─────────────┘    └─────────────┘
                          │
                          ▼
                   ┌─────────────┐
                   │  Analytics  │
                   │   Engine    │
                   └─────────────┘
```

## Subscription Plans

### Basic Plan
- **Price**: ₹49
- **Duration**: 30 days
- **Features**:
  - Access to basic job listings
  - Email notifications
  - Basic profile management
- **Max Jobs**: 50
- **Priority**: Low

### Premium Plan
- **Price**: ₹99
- **Duration**: 90 days
- **Features**:
  - All Basic features
  - Priority job matching
  - Advanced analytics
  - Resume builder tools
- **Max Jobs**: 200
- **Priority**: Medium

### Enterprise Plan
- **Price**: ₹299
- **Duration**: 365 days
- **Features**:
  - All Premium features
  - Custom integrations
  - Dedicated support
  - Advanced reporting
  - Team management
- **Max Jobs**: 1000
- **Priority**: High

## API Endpoints

### 1. Get Current Subscription
```http
GET /v1/subscriptions/current
Authorization: Bearer <token>
```

**Response:**
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
        "features": [...],
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
  }
}
```

### 2. Get Available Plans
```http
GET /v1/subscriptions/plans
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
        "price": 49,
        "duration": 30,
        "features": [...],
        "maxJobs": 50,
        "priority": "low"
      }
    ]
  }
}
```

### 3. Get Subscription History
```http
GET /v1/subscriptions/history?page=1&limit=10&status=completed
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "subscriptions": [
      {
        "id": "subscription_id",
        "plan": "premium",
        "planDetails": {...},
        "status": "completed",
        "startDate": "2024-01-01T00:00:00.000Z",
        "endDate": "2024-04-01T00:00:00.000Z",
        "amount": 99,
        "daysRemaining": 0,
        "isActive": false,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "pages": 1
    }
  }
}
```

### 4. Cancel Subscription
```http
DELETE /v1/subscriptions/:subscriptionId
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Subscription cancelled successfully",
  "data": {
    "subscription": {
      "id": "subscription_id",
      "plan": "premium",
      "status": "cancelled",
      "endDate": "2024-02-15T00:00:00.000Z"
    }
  }
}
```

### 5. Renew Subscription
```http
POST /v1/subscriptions/renew
Authorization: Bearer <token>
Content-Type: application/json

{
  "plan": "premium",
  "amount": 99
}
```

**Response:**
```json
{
  "success": true,
  "message": "Subscription renewal initiated",
  "data": {
    "subscription": {
      "id": "subscription_id",
      "plan": "premium",
      "status": "pending",
      "startDate": "2024-02-15T00:00:00.000Z",
      "endDate": "2024-05-15T00:00:00.000Z",
      "amount": 99
    }
  }
}
```

### 6. Get Subscription Analytics (Admin)
```http
GET /v1/subscriptions/analytics
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalSubscriptions": 150,
      "activeSubscriptions": 120,
      "expiredSubscriptions": 25,
      "cancelledSubscriptions": 5,
      "renewalRate": 75.5
    },
    "planDistribution": [
      {
        "_id": "basic",
        "count": 50,
        "totalAmount": 2450
      }
    ],
    "monthlyTrends": [...],
    "revenueMetrics": {
      "totalRevenue": 14850,
      "averageRevenuePerSubscription": 99
    }
  }
}
```

### 7. Process Subscription Expiry (Cron Job)
```http
POST /v1/subscriptions/process-expiry
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Subscription expiry processing completed",
  "data": {
    "processedCount": 5,
    "totalExpired": 5
  }
}
```

## Subscription Lifecycle

### 1. Subscription Creation
1. User selects a subscription plan
2. Payment is processed through Razorpay
3. Subscription is created with 'completed' status
4. User gains access to plan features

### 2. Active Subscription
1. User has full access to plan features
2. Subscription status is 'completed'
3. End date is in the future
4. User can access premium features

### 3. Expiring Subscription
1. Subscription is approaching end date
2. System sends expiry notifications
3. User can renew or upgrade plan
4. Days remaining countdown

### 4. Expired Subscription
1. End date has passed
2. Status automatically changes to 'expired'
3. User loses access to premium features
4. User can renew to regain access

### 5. Cancelled Subscription
1. User manually cancels subscription
2. Status changes to 'cancelled'
3. End date is set to current date
4. User loses access immediately

## Business Logic

### Subscription Status Management
- **pending**: Awaiting payment verification
- **completed**: Active subscription
- **failed**: Payment failed
- **refunded**: Payment refunded
- **cancelled**: Manually cancelled
- **expired**: Automatically expired

### Feature Access Control
```typescript
// Check if user can access premium features
const canAccessPremium = await canAccessPremiumFeatures(userId);

// Check if user can access enterprise features
const canAccessEnterprise = await canAccessEnterpriseFeatures(userId);

// Get maximum jobs for current plan
const maxJobs = getMaxJobsForPlan(plan);
```

### Plan Changes
```typescript
// Validate plan change
const isValidChange = validatePlanChange(currentPlan, newPlan);

// Calculate prorated amount
const proratedAmount = calculateProratedAmount(
  currentPlan, 
  newPlan, 
  daysRemaining, 
  currentAmount
);
```

## Automatic Processing

### Subscription Expiry
- **Cron Job**: Runs daily to check expired subscriptions
- **Status Update**: Automatically marks expired subscriptions
- **User Update**: Updates user subscription status
- **Logging**: Records all expiry processing

### Expiry Notifications
- **Threshold**: Configurable days before expiry
- **Notifications**: Email and in-app notifications
- **Reminders**: Multiple reminder levels
- **Actions**: Direct renewal links

## Analytics & Reporting

### Key Metrics
- **Total Subscriptions**: Overall subscription count
- **Active Subscriptions**: Currently active subscriptions
- **Expired Subscriptions**: Past expiry subscriptions
- **Cancelled Subscriptions**: Manually cancelled
- **Renewal Rate**: Percentage of renewals
- **Revenue Metrics**: Total and average revenue

### Trends Analysis
- **Monthly Trends**: Subscription growth over time
- **Plan Distribution**: Popularity of different plans
- **Revenue Analysis**: Revenue trends and patterns
- **User Behavior**: Subscription patterns and preferences

## Security Features

### Access Control
- **Authentication Required**: All endpoints require valid tokens
- **Admin Only**: Analytics and expiry processing require admin access
- **User Isolation**: Users can only access their own subscriptions
- **Plan Validation**: All plan changes are validated

### Data Validation
- **Input Validation**: All inputs are validated using Joi schemas
- **Plan Validation**: Subscription plans are validated against allowed values
- **Amount Validation**: Payment amounts are validated
- **Status Validation**: Subscription status changes are validated

## Error Handling

### Common Error Scenarios

1. **No Active Subscription**
   ```json
   {
     "success": false,
     "error": {
       "message": "No active subscription found"
     }
   }
   ```

2. **Invalid Plan**
   ```json
   {
     "success": false,
     "error": {
       "message": "Invalid subscription plan"
     }
   }
   ```

3. **Already Active Subscription**
   ```json
   {
     "success": false,
     "error": {
       "message": "User already has an active subscription"
     }
   }
   ```

4. **Subscription Not Found**
   ```json
   {
     "success": false,
     "error": {
       "message": "Subscription not found"
     }
   }
   ```

### Error Logging
- All errors are logged with context
- Includes user ID, subscription details, and error information
- Helps with debugging and monitoring

## Configuration

### Environment Variables
```bash
# No additional environment variables required
# Uses existing payment and database configuration
```

### Database Indexes
```typescript
// Subscription model indexes
subscriptionSchema.index({ userId: 1 });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ plan: 1 });
subscriptionSchema.index({ startDate: 1 });
subscriptionSchema.index({ endDate: 1 });
subscriptionSchema.index({ createdAt: -1 });
```

## Monitoring

### Key Performance Indicators
- **Subscription Creation Rate**: New subscriptions per day
- **Renewal Rate**: Percentage of successful renewals
- **Expiry Rate**: Subscriptions expiring per day
- **Revenue Growth**: Monthly revenue trends
- **Plan Popularity**: Most popular subscription plans

### Health Checks
- **Database Connectivity**: MongoDB connection status
- **Subscription Processing**: Expiry processing success rate
- **API Response Times**: Endpoint performance metrics
- **Error Rates**: Error frequency and types

## Future Enhancements

1. **Recurring Payments**: Automatic subscription renewals
2. **Plan Upgrades**: Seamless plan changes
3. **Trial Periods**: Free trial subscriptions
4. **Family Plans**: Multi-user subscription packages
5. **Usage Analytics**: Feature usage tracking
6. **A/B Testing**: Plan pricing experiments
7. **Loyalty Programs**: Rewards for long-term subscribers
8. **Referral System**: Referral-based discounts

## Troubleshooting

### Common Issues

1. **Subscription Not Activating**
   - Check payment verification
   - Verify subscription status
   - Check database connectivity

2. **Expiry Not Processing**
   - Verify cron job execution
   - Check subscription dates
   - Review error logs

3. **Analytics Not Loading**
   - Check admin permissions
   - Verify aggregation queries
   - Review database performance

### Debug Steps

1. Check application logs for errors
2. Verify subscription status in database
3. Test individual endpoints
4. Check user permissions
5. Verify plan configurations

## Support

For subscription-related issues:
1. Check subscription status
2. Review payment history
3. Verify plan details
4. Contact development team

## References

- [Subscription Management Best Practices](https://example.com)
- [Revenue Recognition Guidelines](https://example.com)
- [Customer Retention Strategies](https://example.com)
