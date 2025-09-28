# Job Alert System Documentation

## Overview

The Job Alert System is a comprehensive notification system that automatically identifies eligible users for new job postings and sends them personalized email alerts. The system includes intelligent matching algorithms, duplicate prevention, and administrative controls.

## Architecture

### Core Components

1. **Email Templates** (`src/templates/emails/job-alert.hbs`)
   - Handlebars-based HTML email templates
   - Dynamic content rendering with job data
   - Responsive design for all email clients

2. **Email Service** (`src/utils/emailService.ts`)
   - Template loading and compilation
   - SMTP email delivery
   - Error handling and logging

3. **Job Alert Service** (`src/services/jobAlertService.ts`)
   - User eligibility filtering
   - Job matching algorithms
   - Duplicate notification prevention
   - Email delivery coordination

4. **Scheduler Service** (`src/services/schedulerService.ts`)
   - Cron job management
   - Periodic task execution
   - Retry mechanisms for failed notifications

5. **API Controllers** (`src/controllers/jobs/jobAlertController.ts`)
   - Manual trigger endpoints
   - Statistics and monitoring
   - Administrative controls

## Features

### Intelligent User Matching

The system uses sophisticated algorithms to match users with job opportunities:

- **Profile Completion Check**: Only users with complete profiles receive alerts
- **Subscription Status**: Active subscription required for premium features
- **Eligibility Matching**: Multi-criteria matching including:
  - Educational qualifications
  - Stream of study
  - Year of graduation
  - CGPA/Percentage requirements
- **Match Score Calculation**: Weighted scoring system (0-100) for relevance

### Duplicate Prevention

- **Notification Tracking**: `JobNotification` model prevents duplicate alerts
- **Status Management**: Tracks sent, failed, and pending notifications
- **Retry Logic**: Automatic retry for failed email deliveries

### Administrative Controls

- **Manual Triggers**: Admin can manually send alerts for specific jobs
- **Bulk Operations**: Send alerts for all active jobs
- **Dry Run Mode**: Test alerts without actually sending emails
- **Statistics**: Comprehensive reporting and analytics
- **Scheduler Management**: Control automated processes

## API Endpoints

### Job Alert Management

#### Send Job Alerts for Specific Job
```http
POST /api/jobs/alerts/send/:jobId
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "minMatchScore": 40,
  "maxUsers": 100,
  "dryRun": false
}
```

#### Send Job Alerts for All Active Jobs
```http
POST /api/jobs/alerts/send-all
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "minMatchScore": 40,
  "maxUsersPerJob": 100,
  "dryRun": false
}
```

#### Get Job Alert Statistics
```http
GET /api/jobs/alerts/statistics?jobId=optional_job_id
Authorization: Bearer <admin_token>
```

#### Retry Failed Notifications
```http
POST /api/jobs/alerts/retry-failed
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "jobId": "optional_job_id"
}
```

### Scheduler Management

#### Get Scheduler Status
```http
GET /api/jobs/alerts/scheduler/status
Authorization: Bearer <admin_token>
```

#### Trigger Scheduler Task
```http
POST /api/jobs/alerts/scheduler/trigger
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "task": "jobAlerts|retryFailed",
  "dryRun": false
}
```

## Configuration

### Environment Variables

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@notifyx.com
FROM_NAME=NotifyX Team

# Job Alert Configuration
JOB_ALERT_CRON_SCHEDULE=0 9 * * *  # Daily at 9 AM
JOB_ALERT_RETRY_CRON_SCHEDULE=0 */6 * * *  # Every 6 hours
JOB_ALERT_DEFAULT_MIN_MATCH_SCORE=40
JOB_ALERT_DEFAULT_MAX_USERS=100
JOB_ALERT_RETRY_ATTEMPTS=3
JOB_ALERT_RETRY_DELAY=300000  # 5 minutes
```

### Scheduler Configuration

The scheduler service supports multiple cron schedules:

- **Job Alerts**: Daily at 9 AM (configurable)
- **Retry Failed**: Every 6 hours (configurable)
- **Custom Schedules**: Admin can define custom schedules

## Data Models

### JobNotification Schema

```typescript
interface IJobNotification {
  jobId: ObjectId;
  userId: ObjectId;
  status: 'pending' | 'sent' | 'failed';
  matchScore: number;
  emailSentAt?: Date;
  errorMessage?: string;
  retryCount: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### Email Template Context

```typescript
interface JobAlertContext {
  jobTitle: string;
  companyName: string;
  location: string;
  jobType: string;
  description: string;
  applicationLink: string;
}
```

## Usage Examples

### Manual Job Alert Trigger

```typescript
import { sendJobAlertsForJob } from '../services/jobAlertService';

// Send alerts for a specific job
const result = await sendJobAlertsForJob({
  jobId: '507f1f77bcf86cd799439011',
  minMatchScore: 50,
  maxUsers: 50,
  dryRun: false
});

console.log(`Sent ${result.emailsSent} alerts`);
```

### Custom Scheduler Task

```typescript
import { schedulerService } from '../services/schedulerService';

// Add custom job alert schedule
schedulerService.addJobAlertSchedule('0 14 * * *', {
  minMatchScore: 60,
  maxUsers: 200
});
```

### Email Template Customization

```handlebars
<!-- Custom job alert template -->
<div class="job-card">
  <h3>{{jobTitle}}</h3>
  <p><strong>Company:</strong> {{companyName}}</p>
  <p><strong>Location:</strong> {{location}}</p>
  <p><strong>Type:</strong> {{jobType}}</p>
  <p><strong>Description:</strong></p>
  <p>{{description}}</p>
</div>
```

## Monitoring and Analytics

### Key Metrics

- **Total Eligible Users**: Users matching job criteria
- **Emails Sent**: Successfully delivered notifications
- **Emails Failed**: Failed delivery attempts
- **Duplicate Notifications**: Prevented duplicate alerts
- **Users Without Profile**: Incomplete profiles excluded
- **Users With Inactive Subscription**: Subscription issues

### Logging

The system provides comprehensive logging:

```typescript
logger.info('Job alerts sent successfully', {
  jobId: '507f1f77bcf86cd799439011',
  emailsSent: 45,
  emailsFailed: 2,
  totalEligibleUsers: 47
});
```

### Error Handling

- **SMTP Failures**: Automatic retry with exponential backoff
- **Template Errors**: Fallback to default templates
- **Database Errors**: Transaction rollback and error logging
- **Rate Limiting**: Respect email provider limits

## Security Considerations

### Authentication
- All admin endpoints require JWT authentication
- Role-based access control for administrative functions
- API rate limiting to prevent abuse

### Data Privacy
- User email addresses are only used for job alerts
- No personal data stored in email templates
- Secure SMTP configuration with TLS

### Input Validation
- Comprehensive request validation using Joi
- SQL injection prevention through Mongoose
- XSS protection in email templates

## Performance Optimization

### Database Indexing
```typescript
// Recommended indexes for optimal performance
UserProfile.index({ qualification: 1, stream: 1, yearOfPassout: 1 });
JobNotification.index({ jobId: 1, userId: 1 });
JobNotification.index({ status: 1, createdAt: 1 });
```

### Caching Strategy
- Template compilation caching
- User eligibility result caching
- Job data caching for bulk operations

### Batch Processing
- Process users in batches to prevent memory issues
- Configurable batch sizes for different operations
- Progress tracking for long-running operations

## Troubleshooting

### Common Issues

1. **Emails Not Sending**
   - Check SMTP configuration
   - Verify email provider limits
   - Check spam folder settings

2. **Low Match Scores**
   - Review user profile completeness
   - Adjust matching criteria
   - Check job eligibility requirements

3. **Scheduler Not Running**
   - Verify cron schedule format
   - Check server timezone settings
   - Review application logs

### Debug Mode

Enable debug logging for detailed troubleshooting:

```typescript
// Set log level to debug
process.env.LOG_LEVEL = 'debug';

// Enable dry run mode
const result = await sendJobAlertsForJob({
  jobId: '507f1f77bcf86cd799439011',
  dryRun: true
});
```

## Future Enhancements

### Planned Features

1. **Advanced Matching**
   - Machine learning-based recommendations
   - Skills-based matching
   - Location preference matching

2. **User Preferences**
   - Customizable alert frequency
   - Job type preferences
   - Salary range filters

3. **Analytics Dashboard**
   - Real-time statistics
   - User engagement metrics
   - Performance monitoring

4. **Multi-language Support**
   - Localized email templates
   - Regional job matching
   - Cultural preferences

### Integration Opportunities

1. **Third-party Services**
   - LinkedIn job posting integration
   - Indeed API integration
   - Glassdoor company data

2. **Mobile Notifications**
   - Push notification support
   - SMS alerts
   - Mobile app integration

3. **Advanced Analytics**
   - User behavior tracking
   - Conversion rate analysis
   - A/B testing framework
