# Razorpay Payment Integration

This document describes the Razorpay payment integration implementation for the NotifyX Backend.

## Overview

The payment system integrates Razorpay payment gateway to handle subscription plan purchases, payment verification, and subscription management.

## Features

- **Order Creation**: Create Razorpay orders for subscription plans
- **Payment Verification**: Verify payments with signature validation
- **Webhook Handling**: Process Razorpay webhooks for payment status updates
- **Subscription Management**: Automatically manage user subscriptions based on payments
- **Payment History**: Track payment and subscription history
- **Refund Processing**: Handle refunds through Razorpay API

## Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Frontend  │───▶│   Backend   │───▶│  Razorpay  │
│             │    │             │    │             │
└─────────────┘    └─────────────┘    └─────────────┘
                          │
                          ▼
                   ┌─────────────┐
                   │  Database   │
                   │             │
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

### 1. Create Payment Order
```http
POST /v1/payments/create-order
Authorization: Bearer <token>
Content-Type: application/json

{
  "plan": "premium",
  "amount": 99,
  "currency": "INR"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "order": {
      "id": "order_1234567890",
      "amount": 9900,
      "currency": "INR",
      "receipt": "order_1234567890_user123",
      "status": "created"
    },
    "keyId": "rzp_test_1234567890"
  }
}
```

### 2. Verify Payment
```http
POST /v1/payments/verify
Authorization: Bearer <token>
Content-Type: application/json

{
  "razorpay_order_id": "order_1234567890",
  "razorpay_payment_id": "pay_1234567890",
  "razorpay_signature": "signature_hash",
  "plan": "premium",
  "amount": 99
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment verified and subscription activated",
  "data": {
    "subscription": {
      "id": "subscription_id",
      "plan": "premium",
      "status": "completed",
      "startDate": "2024-01-01T00:00:00.000Z",
      "endDate": "2024-04-01T00:00:00.000Z",
      "amount": 99
    },
    "payment": {
      "orderId": "order_1234567890",
      "paymentId": "pay_1234567890",
      "status": "captured"
    }
  }
}
```

### 3. Get Payment History
```http
GET /v1/payments/history?page=1&limit=10
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
        "status": "completed",
        "amount": 99,
        "startDate": "2024-01-01T00:00:00.000Z",
        "endDate": "2024-04-01T00:00:00.000Z"
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

### 4. Webhook Endpoint
```http
POST /v1/payments/webhook
Content-Type: application/json
X-Razorpay-Signature: <webhook_signature>

{
  "event": "payment.captured",
  "payload": {
    "payment": {
      "entity": {
        "id": "pay_1234567890",
        "order_id": "order_1234567890"
      }
    }
  }
}
```

## Payment Flow

### 1. Order Creation
1. User selects a subscription plan
2. Frontend calls `/v1/payments/create-order`
3. Backend creates Razorpay order
4. Returns order details to frontend

### 2. Payment Processing
1. Frontend redirects to Razorpay payment page
2. User completes payment
3. Razorpay redirects back to frontend with payment details

### 3. Payment Verification
1. Frontend calls `/v1/payments/verify` with payment details
2. Backend verifies payment signature
3. Backend verifies payment with Razorpay API
4. Backend creates/updates subscription
5. Backend updates user subscription status

### 4. Webhook Processing
1. Razorpay sends webhook for payment status changes
2. Backend verifies webhook signature
3. Backend updates subscription status accordingly

## Security Features

### 1. Payment Signature Verification
- Uses HMAC-SHA256 for signature validation
- Prevents payment tampering
- Ensures payment authenticity

### 2. Webhook Signature Verification
- Validates webhook authenticity
- Prevents unauthorized webhook calls
- Uses webhook secret for verification

### 3. Input Validation
- Validates all payment inputs
- Prevents invalid data submission
- Uses Joi schema validation

## Error Handling

### Common Error Scenarios

1. **Invalid Plan**
   ```json
   {
     "success": false,
     "error": {
       "message": "Invalid subscription plan"
     }
   }
   ```

2. **Payment Verification Failed**
   ```json
   {
     "success": false,
     "error": {
       "message": "Payment verification failed"
     }
   }
   ```

3. **Invalid Amount**
   ```json
   {
     "success": false,
     "error": {
       "message": "Invalid amount"
     }
   }
   ```

### Error Logging
- All payment errors are logged with context
- Includes user ID, payment details, and error information
- Helps with debugging and monitoring

## Configuration

### Environment Variables

```bash
# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

### Razorpay Dashboard Setup

1. **Create Account**: Sign up at [razorpay.com](https://razorpay.com)
2. **Get API Keys**: Generate test/live API keys
3. **Configure Webhooks**: Set webhook URL to `/v1/payments/webhook`
4. **Set Webhook Secret**: Configure webhook secret in dashboard

## Testing

### Test Mode
- Use Razorpay test mode for development
- Test cards available in Razorpay documentation
- No real money involved in test mode

### Test Cards
- **Success**: 4111 1111 1111 1111
- **Failure**: 4000 0000 0000 0002
- **3D Secure**: 4000 0000 0000 0002

## Monitoring

### Payment Metrics
- Order creation success rate
- Payment verification success rate
- Webhook processing success rate
- Subscription activation rate

### Logging
- All payment operations are logged
- Includes user context and payment details
- Helps with debugging and analytics

## Future Enhancements

1. **Recurring Payments**: Support for automatic renewals
2. **Multiple Payment Methods**: Support for UPI, cards, net banking
3. **International Payments**: Support for multiple currencies
4. **Payment Analytics**: Advanced payment reporting and analytics
5. **Refund Management**: Automated refund processing
6. **Payment Retry**: Automatic retry for failed payments

## Troubleshooting

### Common Issues

1. **Payment Verification Fails**
   - Check signature generation
   - Verify webhook secret
   - Ensure correct order and payment IDs

2. **Webhook Not Received**
   - Verify webhook URL configuration
   - Check webhook secret
   - Ensure proper event subscription

3. **Subscription Not Activated**
   - Check payment status in Razorpay
   - Verify webhook processing
   - Check database connection

### Debug Steps

1. Check application logs for errors
2. Verify Razorpay dashboard for payment status
3. Test webhook endpoint manually
4. Verify environment variables
5. Check database connectivity

## Support

For payment-related issues:
1. Check Razorpay documentation
2. Review application logs
3. Verify configuration settings
4. Contact development team

## References

- [Razorpay API Documentation](https://razorpay.com/docs/api/)
- [Razorpay Webhooks](https://razorpay.com/docs/webhooks/)
- [Payment Integration Guide](https://razorpay.com/docs/payment-gateway/)
