# Payment Integration Documentation

## Overview

This document provides comprehensive documentation for the X Career Backend payment integration system using Razorpay. The system supports subscription-based payments for Basic (₹49/month) and Premium (₹99/month) plans.

## Table of Contents

1. [Setup and Configuration](#setup-and-configuration)
2. [API Endpoints](#api-endpoints)
3. [Webhook Integration](#webhook-integration)
4. [Testing](#testing)
5. [Deployment](#deployment)
6. [Troubleshooting](#troubleshooting)

## Setup and Configuration

### Environment Variables

Add the following environment variables to your `.env` file:

```bash
# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/xcareer

# JWT Configuration
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
```

### Razorpay Account Setup

1. Create a Razorpay account at [https://razorpay.com](https://razorpay.com)
2. Get your API keys from the Razorpay Dashboard
3. Set up webhook endpoint in Razorpay Dashboard: `https://yourdomain.com/api/v1/payments/webhook`
4. Configure webhook events: `payment.captured`, `payment.failed`, `refund.processed`

## API Endpoints

### 1. Create Payment Order

**Endpoint:** `POST /api/v1/payments/create-order`

**Authentication:** Required (JWT Token)

**Request Body:**
```json
{
  "plan": "basic", // or "premium", "enterprise"
  "amount": 49,    // Amount in INR
  "currency": "INR"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "order": {
      "id": "order_1234567890",
      "amount": 4900,
      "currency": "INR",
      "receipt": "order_1234567890_user123",
      "status": "created"
    }
    },
  "timestamp": "2024-12-19T10:00:00.000Z"
}
```

### 2. Verify Payment

**Endpoint:** `POST /api/v1/payments/verify`

**Authentication:** Required (JWT Token)

**Request Body:**
```json
{
  "razorpay_order_id": "order_1234567890",
  "razorpay_payment_id": "pay_1234567890",
  "razorpay_signature": "signature_hash",
  "plan": "basic",
  "amount": 49
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment verified successfully",
  "data": {
    "subscription": {
      "id": "sub_1234567890",
      "plan": "basic",
      "status": "active",
      "amount": 49,
      "startDate": "2024-12-19T10:00:00.000Z",
      "endDate": "2025-01-19T10:00:00.000Z"
    }
  },
  "timestamp": "2024-12-19T10:00:00.000Z"
}
```

### 3. Get Payment History

**Endpoint:** `GET /api/v1/payments/history`

**Authentication:** Required (JWT Token)

**Query Parameters:**
- `page` (optional): Page number for pagination
- `limit` (optional): Number of items per page

**Response:**
```json
{
  "success": true,
  "data": {
    "payments": [
      {
        "id": "sub_1234567890",
        "plan": "basic",
        "amount": 49,
        "status": "active",
        "createdAt": "2024-12-19T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "pages": 1
    }
  },
  "timestamp": "2024-12-19T10:00:00.000Z"
}
```

### 4. Get Payment Status

**Endpoint:** `GET /api/v1/payments/status/:subscriptionId`

**Authentication:** Required (JWT Token)

**Response:**
```json
{
  "success": true,
  "data": {
    "subscription": {
      "id": "sub_1234567890",
      "plan": "basic",
      "status": "active",
      "amount": 49,
      "startDate": "2024-12-19T10:00:00.000Z",
      "endDate": "2025-01-19T10:00:00.000Z",
      "isActive": true,
      "isExpired": false,
      "daysRemaining": 30
    },
    "payment": {
      "id": "pay_1234567890",
      "status": "captured",
      "amount": 4900,
      "currency": "INR",
      "method": "card"
    }
  },
  "timestamp": "2024-12-19T10:00:00.000Z"
}
```

### 5. Cancel Subscription

**Endpoint:** `POST /api/v1/payments/cancel-subscription`

**Authentication:** Required (JWT Token)

**Request Body:**
```json
{
  "subscriptionId": "sub_1234567890",
  "reason": "User requested cancellation"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Subscription cancelled successfully",
  "data": {
    "subscription": {
      "id": "sub_1234567890",
      "plan": "basic",
      "status": "cancelled",
      "cancelledAt": "2024-12-19T10:00:00.000Z",
      "reason": "User requested cancellation"
    }
  },
  "timestamp": "2024-12-19T10:00:00.000Z"
}
```

## Webhook Integration

### Webhook Endpoint

**Endpoint:** `POST /api/v1/payments/webhook`

**Authentication:** Not required (uses signature verification)

### Supported Events

1. **payment.captured** - Payment successful
2. **payment.failed** - Payment failed
3. **refund.processed** - Refund processed

### Webhook Security

The webhook endpoint uses HMAC SHA256 signature verification for security:

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return expectedSignature === signature;
}
```

### Webhook Payload Example

```json
{
  "event": "payment.captured",
  "payload": {
    "payment": {
      "entity": {
        "id": "pay_1234567890",
        "amount": 4900,
        "currency": "INR",
        "status": "captured",
        "order_id": "order_1234567890"
      }
    }
  }
}
```

## Testing

### Running Payment Tests

```bash
# Run comprehensive payment API tests
npm run test:payment

# Run specific test file
npx ts-node scripts/testPaymentAPI.ts
```

### Test Coverage

The test suite covers:

1. **Payment Plan Validation**
   - Valid plan retrieval
   - Invalid plan handling

2. **Order Creation**
   - Basic plan order creation
   - Premium plan order creation
   - Invalid order data validation

3. **Payment Verification**
   - Valid payment verification
   - Invalid payment verification

4. **Payment History**
   - Get payment history
   - Pagination testing

5. **Payment Status**
   - Valid subscription status
   - Invalid subscription handling

6. **Subscription Cancellation**
   - Valid cancellation
   - Invalid cancellation data

7. **Webhook Security**
   - Signature verification
   - Invalid signature handling

8. **Authentication**
   - Required authentication
   - Unauthenticated access handling

9. **Rate Limiting**
   - Multiple request handling

10. **Error Handling**
    - Malformed JSON
    - Missing required fields

### Test Results

```bash
📊 Test Results Summary:
Total Tests: 25
Passed: 23
Failed: 2
Success Rate: 92.00%
```

## Deployment

### Production Configuration

1. **Environment Variables**
   ```bash
   NODE_ENV=production
   RAZORPAY_KEY_ID=rzp_live_...
   RAZORPAY_KEY_SECRET=your_live_secret
   RAZORPAY_WEBHOOK_SECRET=your_live_webhook_secret
   ```

2. **Database Setup**
   ```bash
   # Create production database
   mongodb://production-server:27017/xcareer_prod
   ```

3. **Webhook Configuration**
   - Update webhook URL in Razorpay Dashboard
   - Configure production webhook secret
   - Test webhook delivery

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

### Health Checks

```bash
# Check payment service health
curl -X GET https://yourdomain.com/api/v1/health/payments

# Check webhook endpoint
curl -X POST https://yourdomain.com/api/v1/payments/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": "webhook"}'
```

## Troubleshooting

### Common Issues

1. **Webhook Not Receiving Events**
   - Check webhook URL configuration in Razorpay Dashboard
   - Verify webhook secret matches
   - Check server logs for webhook delivery attempts

2. **Payment Verification Fails**
   - Verify Razorpay API keys are correct
   - Check signature generation algorithm
   - Ensure order ID and payment ID match

3. **Database Connection Issues**
   - Verify MongoDB connection string
   - Check database permissions
   - Ensure indexes are created

### Debug Mode

Enable debug logging:

```bash
DEBUG=payment:* npm start
```

### Log Analysis

```bash
# Check payment logs
tail -f logs/payment.log

# Search for specific payment ID
grep "pay_1234567890" logs/payment.log

# Check webhook events
grep "webhook" logs/payment.log
```

### Support

For technical support:

1. Check server logs for error details
2. Verify Razorpay Dashboard for payment status
3. Test webhook endpoint manually
4. Contact development team with error logs

## Security Considerations

1. **API Key Security**
   - Store API keys in environment variables
   - Never commit keys to version control
   - Use different keys for test and production

2. **Webhook Security**
   - Always verify webhook signatures
   - Use HTTPS for webhook endpoints
   - Implement rate limiting

3. **Data Protection**
   - Encrypt sensitive payment data
   - Implement proper access controls
   - Regular security audits

## Monitoring

### Key Metrics

1. **Payment Success Rate**
2. **Webhook Delivery Success Rate**
3. **API Response Times**
4. **Error Rates**

### Alerts

Set up alerts for:
- Payment failures
- Webhook delivery failures
- High error rates
- Database connection issues

## Changelog

### Version 1.0.0 (2024-12-19)
- Initial payment integration
- Basic and Premium plan support
- Webhook integration
- Comprehensive testing suite
- Documentation and deployment guides