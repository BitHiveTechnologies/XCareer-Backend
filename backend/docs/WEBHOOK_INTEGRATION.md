# Webhook Integration Documentation

## Overview

This document describes the comprehensive webhook integration for handling Razorpay subscription events. The webhook system provides real-time processing of payment and subscription lifecycle events to maintain data consistency and trigger appropriate business logic.

## Webhook Endpoint

**URL:** `POST /api/v1/payments/webhook`  
**Authentication:** None (webhook signature validation required)  
**Content-Type:** `application/json`

## Security

### Signature Validation

All webhook requests must include a valid Razorpay signature in the `x-razorpay-signature` header. The signature is generated using HMAC-SHA256 with the webhook secret.

```javascript
const signature = crypto
  .createHmac('sha256', webhookSecret)
  .update(JSON.stringify(requestBody))
  .digest('hex');
```

### Environment Configuration

Set the following environment variable:
```bash
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
```

## Supported Events

### Payment Events

#### 1. Payment Captured (`payment.captured`)
Triggered when a payment is successfully captured.

**Payload Structure:**
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
        "order_id": "order_1234567890",
        "method": "card",
        "description": "Payment for Basic Plan",
        "created_at": 1640995200
      }
    }
  }
}
```

**Handler Actions:**
- Updates subscription status to 'completed'
- Creates/updates subscription record
- Updates user subscription status
- Logs successful payment

#### 2. Payment Failed (`payment.failed`)
Triggered when a payment fails.

**Payload Structure:**
```json
{
  "event": "payment.failed",
  "payload": {
    "payment": {
      "entity": {
        "id": "pay_1234567890",
        "amount": 4900,
        "currency": "INR",
        "status": "failed",
        "order_id": "order_1234567890",
        "method": "card",
        "error_code": "BAD_REQUEST_ERROR",
        "error_description": "Payment failed",
        "created_at": 1640995200
      }
    }
  }
}
```

**Handler Actions:**
- Updates subscription status to 'failed'
- Logs payment failure
- Maintains audit trail

#### 3. Refund Processed (`refund.processed`)
Triggered when a refund is processed.

**Payload Structure:**
```json
{
  "event": "refund.processed",
  "payload": {
    "refund": {
      "entity": {
        "id": "rfnd_1234567890",
        "payment_id": "pay_1234567890",
        "amount": 4900,
        "currency": "INR",
        "status": "processed",
        "created_at": 1640995200
      }
    }
  }
}
```

**Handler Actions:**
- Updates subscription status to 'refunded'
- Logs refund processing
- Maintains audit trail

### Subscription Events

#### 4. Subscription Activated (`subscription.activated`)
Triggered when a subscription is activated.

**Payload Structure:**
```json
{
  "event": "subscription.activated",
  "payload": {
    "subscription": {
      "entity": {
        "id": "sub_1234567890",
        "customer_id": "cust_1234567890",
        "plan_id": "plan_basic",
        "status": "active",
        "current_start": 1640995200,
        "current_end": 1643587200,
        "created_at": 1640995200
      }
    }
  }
}
```

**Handler Actions:**
- Updates user subscription status to 'active'
- Logs subscription activation

#### 5. Subscription Charged (`subscription.charged`)
Triggered when a recurring subscription charge is processed.

**Payload Structure:**
```json
{
  "event": "subscription.charged",
  "payload": {
    "subscription": {
      "entity": {
        "id": "sub_1234567890",
        "customer_id": "cust_1234567890",
        "plan_id": "plan_premium",
        "status": "active"
      }
    },
    "payment": {
      "entity": {
        "id": "pay_1234567890",
        "amount": 9900,
        "currency": "INR",
        "status": "captured",
        "method": "card",
        "created_at": 1640995200
      }
    }
  }
}
```

**Handler Actions:**
- Creates new subscription record for the charge
- Updates user subscription status
- Logs recurring charge

#### 6. Subscription Completed (`subscription.completed`)
Triggered when a subscription reaches its end date.

**Payload Structure:**
```json
{
  "event": "subscription.completed",
  "payload": {
    "subscription": {
      "entity": {
        "id": "sub_1234567890",
        "customer_id": "cust_1234567890",
        "plan_id": "plan_enterprise",
        "status": "completed",
        "current_start": 1640995200,
        "current_end": 1643587200,
        "created_at": 1640995200
      }
    }
  }
}
```

**Handler Actions:**
- Updates user subscription status to 'completed'
- Logs subscription completion

#### 7. Subscription Cancelled (`subscription.cancelled`)
Triggered when a subscription is cancelled.

**Payload Structure:**
```json
{
  "event": "subscription.cancelled",
  "payload": {
    "subscription": {
      "entity": {
        "id": "sub_1234567890",
        "customer_id": "cust_1234567890",
        "plan_id": "plan_basic",
        "status": "cancelled",
        "cancelled_at": 1640995200,
        "current_start": 1640995200,
        "current_end": 1643587200,
        "created_at": 1640995200
      }
    }
  }
}
```

**Handler Actions:**
- Updates user subscription status to 'cancelled'
- Updates subscription record with cancellation details
- Logs subscription cancellation

#### 8. Subscription Paused (`subscription.paused`)
Triggered when a subscription is paused.

**Payload Structure:**
```json
{
  "event": "subscription.paused",
  "payload": {
    "subscription": {
      "entity": {
        "id": "sub_1234567890",
        "customer_id": "cust_1234567890",
        "plan_id": "plan_premium",
        "status": "paused",
        "paused_at": 1640995200,
        "current_start": 1640995200,
        "current_end": 1643587200,
        "created_at": 1640995200
      }
    }
  }
}
```

**Handler Actions:**
- Updates user subscription status to 'paused'
- Logs subscription pause

#### 9. Subscription Resumed (`subscription.resumed`)
Triggered when a paused subscription is resumed.

**Payload Structure:**
```json
{
  "event": "subscription.resumed",
  "payload": {
    "subscription": {
      "entity": {
        "id": "sub_1234567890",
        "customer_id": "cust_1234567890",
        "plan_id": "plan_premium",
        "status": "active",
        "resumed_at": 1640995200,
        "current_start": 1640995200,
        "current_end": 1643587200,
        "created_at": 1640995200
      }
    }
  }
}
```

**Handler Actions:**
- Updates user subscription status to 'active'
- Logs subscription resumption

#### 10. Subscription Halted (`subscription.halted`)
Triggered when a subscription is halted due to payment failures.

**Payload Structure:**
```json
{
  "event": "subscription.halted",
  "payload": {
    "subscription": {
      "entity": {
        "id": "sub_1234567890",
        "customer_id": "cust_1234567890",
        "plan_id": "plan_enterprise",
        "status": "halted",
        "halted_at": 1640995200,
        "current_start": 1640995200,
        "current_end": 1643587200,
        "created_at": 1640995200
      }
    }
  }
}
```

**Handler Actions:**
- Updates user subscription status to 'halted'
- Logs subscription halt

#### 11. Subscription Updated (`subscription.updated`)
Triggered when subscription details are updated.

**Payload Structure:**
```json
{
  "event": "subscription.updated",
  "payload": {
    "subscription": {
      "entity": {
        "id": "sub_1234567890",
        "customer_id": "cust_1234567890",
        "plan_id": "plan_premium",
        "status": "active",
        "updated_at": 1640995200,
        "current_start": 1640995200,
        "current_end": 1643587200,
        "created_at": 1640995200
      }
    }
  }
}
```

**Handler Actions:**
- Logs subscription update
- Maintains audit trail

## Error Handling

### Webhook Processing Errors

The webhook handler includes comprehensive error handling:

1. **Signature Validation Errors:**
   - Missing signature: Returns 400 Bad Request
   - Invalid signature: Returns 400 Bad Request

2. **Processing Errors:**
   - Database errors: Logged and returns 500 Internal Server Error
   - User not found: Logged and continues processing
   - Invalid payload: Logged and returns 400 Bad Request

3. **Unhandled Events:**
   - Unknown events are logged but not treated as errors
   - Returns 200 OK for successful webhook receipt

## Testing

### Manual Testing

Use the provided test script to verify webhook functionality:

```bash
cd backend
npx ts-node scripts/testWebhookEvents.ts
```

### Test Coverage

The test suite covers:
- All supported webhook events
- Signature validation
- Error handling scenarios
- Unhandled event processing

## Monitoring and Logging

### Logging

All webhook events are logged with:
- Event type and payload
- Processing status
- Error details (if any)
- User and subscription information

### Monitoring

Monitor webhook processing for:
- Failed signature validations
- Processing errors
- Unhandled events
- Performance metrics

## Deployment Considerations

### Production Setup

1. **Webhook URL Configuration:**
   ```
   https://yourdomain.com/api/v1/payments/webhook
   ```

2. **Environment Variables:**
   ```bash
   RAZORPAY_WEBHOOK_SECRET=your_production_webhook_secret
   ```

3. **SSL/TLS Requirements:**
   - Webhook endpoint must be HTTPS
   - Valid SSL certificate required

### Security Best Practices

1. **Webhook Secret:**
   - Use a strong, unique secret
   - Rotate regularly
   - Store securely

2. **Rate Limiting:**
   - Implement rate limiting for webhook endpoint
   - Monitor for abuse

3. **IP Whitelisting:**
   - Consider whitelisting Razorpay IPs
   - Monitor for suspicious requests

## Troubleshooting

### Common Issues

1. **Signature Validation Failures:**
   - Verify webhook secret configuration
   - Check payload serialization
   - Ensure proper header format

2. **Processing Failures:**
   - Check database connectivity
   - Verify user lookup logic
   - Review error logs

3. **Missing Events:**
   - Verify webhook URL configuration
   - Check network connectivity
   - Review Razorpay dashboard

### Debug Mode

Enable debug logging by setting:
```bash
TASKMASTER_LOG_LEVEL=debug
```

This provides detailed information about webhook processing.

## API Reference

### Webhook Endpoint

**POST** `/api/v1/payments/webhook`

**Headers:**
- `Content-Type: application/json`
- `x-razorpay-signature: <signature>`

**Request Body:**
```json
{
  "event": "payment.captured",
  "payload": {
    // Event-specific payload
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Webhook processed successfully"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "message": "Invalid webhook signature"
  }
}
```

## Integration Examples

### Frontend Integration

```javascript
// Handle webhook events in frontend
const handleWebhookEvent = (event, payload) => {
  switch (event) {
    case 'payment.captured':
      // Update UI to show successful payment
      break;
    case 'subscription.cancelled':
      // Update UI to show cancelled subscription
      break;
    // Handle other events...
  }
};
```

### Backend Integration

```javascript
// Custom webhook handler
const customWebhookHandler = async (req, res) => {
  const { event, payload } = req.body;
  
  // Custom business logic
  await processCustomLogic(event, payload);
  
  // Call default handler
  await handleWebhook(req, res);
};
```

This comprehensive webhook integration ensures reliable processing of all Razorpay subscription events while maintaining data consistency and providing detailed audit trails.
