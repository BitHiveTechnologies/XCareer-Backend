# Email Notification System

This document describes the comprehensive email notification system implemented for NotifyX.

## Overview

The email notification system provides automated email communications for various user interactions including:
- Welcome emails for new users
- Job alert notifications
- Password reset emails
- Subscription expiry reminders
- Custom notification templates

## Architecture

### Core Components

1. **EmailService** (`src/utils/emailService.ts`)
   - NodeMailer integration
   - Template management with Handlebars
   - SMTP configuration for production/development
   - Connection verification

2. **EmailQueueService** (`src/utils/emailQueue.ts`)
   - Bull queue for async email processing
   - Retry mechanisms with exponential backoff
   - Job status tracking
   - Queue monitoring

3. **EmailNotificationController** (`src/controllers/notifications/emailNotificationController.ts`)
   - API endpoints for email operations
   - User and job data integration
   - Bulk email operations
   - Queue status monitoring

4. **Email Templates** (`src/templates/emails/`)
   - Handlebars (.hbs) templates
   - Responsive HTML design
   - Plain text fallbacks
   - Customizable content

## Features

### Email Types

- **Welcome Email**: Sent to new users upon registration
- **Job Alert Email**: Notifies users about matching job opportunities
- **Password Reset**: Secure password reset functionality
- **Subscription Expiry**: Reminds users about expiring subscriptions

### Queue Management

- **Asynchronous Processing**: Emails are queued and processed in background
- **Retry Logic**: Failed emails are retried with exponential backoff
- **Priority System**: High-priority emails can be processed first
- **Status Tracking**: Monitor email delivery status and queue health

### Template System

- **Handlebars Integration**: Dynamic content insertion
- **Responsive Design**: Mobile-friendly email layouts
- **Customization**: Easy template modification and extension
- **Fallback Support**: Plain text versions for email clients

## API Endpoints

### Email Notifications

```
POST /api/v1/notifications/welcome
POST /api/v1/notifications/job-alert
GET  /api/v1/notifications/queue-status
GET  /api/v1/notifications/test-connection
```

### Request Examples

#### Send Welcome Email
```json
POST /api/v1/notifications/welcome
{
  "email": "user@example.com",
  "name": "John Doe"
}
```

#### Send Job Alert
```json
POST /api/v1/notifications/job-alert
{
  "userId": "507f1f77bcf86cd799439011",
  "jobId": "507f1f77bcf86cd799439012"
}
```

## Configuration

### Environment Variables

```bash
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Redis Configuration (for email queue)
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Development vs Production

- **Development**: Uses Ethereal email for testing
- **Production**: Uses configured SMTP server (Gmail, etc.)

## Usage Examples

### Sending Welcome Email

```typescript
import { emailService } from '../utils/emailService';

// Send welcome email
const success = await emailService.sendWelcomeEmail('user@example.com', 'John Doe');
```

### Queueing Job Alert

```typescript
import { emailQueueService } from '../utils/emailQueue';

// Queue job alert email
const job = await emailQueueService.addEmailJob({
  to: 'user@example.com',
  subject: 'New Job Opportunity',
  template: 'job-alert',
  context: { jobTitle: 'Software Engineer', company: 'Tech Corp' }
});
```

## Monitoring

### Queue Status

```typescript
const status = await emailQueueService.getQueueStatus();
console.log(status);
// Output: { waiting: 5, active: 2, completed: 100, failed: 3, delayed: 0 }
```

### Connection Testing

```typescript
const isConnected = await emailService.verifyConnection();
console.log('Email service connected:', isConnected);
```

## Security Features

- **Input Validation**: All email inputs are validated and sanitized
- **Authentication**: Admin-only access to email operations
- **Rate Limiting**: Prevents email spam and abuse
- **Template Sanitization**: Handlebars prevents XSS attacks

## Error Handling

- **Graceful Degradation**: Failed emails don't crash the system
- **Retry Mechanisms**: Automatic retry for failed email attempts
- **Logging**: Comprehensive logging for debugging and monitoring
- **Fallback Options**: Alternative email delivery methods

## Performance

- **Async Processing**: Non-blocking email operations
- **Queue Management**: Efficient job processing and distribution
- **Template Caching**: Compiled templates for faster rendering
- **Connection Pooling**: Optimized SMTP connections

## Future Enhancements

- [ ] Email delivery tracking and analytics
- [ ] A/B testing for email templates
- [ ] Advanced scheduling and automation
- [ ] Integration with email marketing platforms
- [ ] Advanced template editor
- [ ] Email performance metrics

## Troubleshooting

### Common Issues

1. **SMTP Connection Failed**
   - Check email credentials
   - Verify SMTP settings
   - Check firewall/network settings

2. **Queue Not Processing**
   - Verify Redis connection
   - Check queue worker status
   - Review error logs

3. **Template Not Found**
   - Verify template file exists
   - Check template compilation
   - Review file permissions

### Debug Mode

Enable debug logging by setting:
```bash
LOG_LEVEL=debug
```

## Testing

### Unit Tests

```bash
npm test -- --grep "email"
```

### Integration Tests

```bash
npm run test:integration -- --grep "notifications"
```

### Manual Testing

Use the test endpoints to verify email functionality:
```bash
curl -X GET "http://localhost:5000/api/v1/notifications/test-connection" \
  -H "Authorization: Bearer <admin-token>"
```
