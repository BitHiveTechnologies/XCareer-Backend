# 📧 Email Setup Guide for Job Alert Notifications

## Overview
This guide will help you configure email sending for the job alert notification system using Gmail SMTP (recommended for development) or other email providers.

## 🚨 IMPORTANT: Current Issue
From the server logs, we see:
```
[INFO] Email templates directory not found, using default templates
```

This means the Handlebars email templates are not being loaded correctly.

## Step 1: Create .env File
Create a `.env` file in the `backend/` directory with the following configuration:

```bash
# Copy from env.template
cp env.template .env
```

## Step 2: Configure Email Settings in .env

### Option A: Gmail SMTP (Recommended for Development)
```env
# Email Configuration for Gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
SUPPORT_EMAIL=your-email@gmail.com
```

### Option B: Other Email Providers

#### Outlook/Hotmail
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=your-email@outlook.com
EMAIL_PASS=your-password
```

#### SendGrid
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=your-sendgrid-api-key
```

#### Amazon SES
```env
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_PORT=587
EMAIL_USER=your-ses-smtp-username
EMAIL_PASS=your-ses-smtp-password
```

## Step 3: Gmail App Password Setup (Most Common)

### 3.1 Enable 2-Factor Authentication
1. Go to your Google Account settings
2. Security → 2-Step Verification
3. Enable 2-factor authentication

### 3.2 Generate App Password
1. Go to Security → App passwords
2. Select "Mail" and "Other (custom name)"
3. Enter "NotifyX Backend" as the name
4. Copy the 16-character password
5. Use this password in your `.env` file as `EMAIL_PASS`

### 3.3 Update .env File
```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop  # 16-character app password (without spaces)
```

## Step 4: Fix Email Templates Directory Issue

The issue is that our email templates are not being found. Let's check and fix this:

### Current Template Location
- Templates are in: `src/templates/emails/`
- System is looking for: `dist/templates/emails/` (after build)

### Fix the Issue
We need to ensure templates are copied to the dist folder during build.

## Step 5: Test Email Configuration

### 5.1 Test Basic Email Sending
```bash
# Run the email test script
cd backend
npm run test:email
```

### 5.2 Test Job Alert Email
```bash
# Test job alert specific email
curl -X POST http://localhost:3001/api/v1/jobs/alerts/send/SOME_JOB_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{"dryRun": true}'
```

## Step 6: Monitor Email Sending

### Check Server Logs
```bash
# Watch for email-related logs
tail -f logs/app.log | grep -i email
```

### Common Log Messages
- ✅ `Email transporter initialized with configured SMTP settings`
- ✅ `Job alert email sent successfully`
- ❌ `Failed to send job alert email`
- ❌ `Send job alert email failed`

## Step 7: Production Configuration

### Environment Variables for Production
```env
NODE_ENV=production
EMAIL_HOST=your-production-smtp-host
EMAIL_PORT=587
EMAIL_USER=your-production-email
EMAIL_PASS=your-production-password
SUPPORT_EMAIL=support@yourcompany.com
```

### Recommended Production Email Services
1. **SendGrid** - Reliable, good deliverability
2. **Amazon SES** - Cost-effective, AWS integration
3. **Mailgun** - Developer-friendly API
4. **Google Workspace** - If using Google for business

## Troubleshooting

### Common Issues

#### 1. "Authentication failed" Error
- Check if 2FA is enabled and app password is correct
- Verify EMAIL_USER and EMAIL_PASS in .env

#### 2. "Connection timeout" Error
- Check EMAIL_HOST and EMAIL_PORT
- Verify firewall/network settings

#### 3. "Templates not found" Error
- Ensure templates exist in `src/templates/emails/`
- Check build process copies templates to `dist/`

#### 4. "Self-signed certificate" Error
```javascript
// Add to emailService.ts if using self-signed certificates
secure: false,
tls: {
  rejectUnauthorized: false
}
```

### Debug Mode
Enable email debugging in development:
```env
LOG_LEVEL=debug
```

### Test Email Template Rendering
```javascript
// Test in Node.js console
const emailService = require('./dist/utils/emailService').emailService;
emailService.sendJobAlertEmail('test@example.com', {
  title: 'Test Job',
  company: 'Test Company',
  location: 'Test Location',
  type: 'Full-time',
  description: 'Test description',
  applicationLink: 'https://example.com/apply'
});
```

## Email Template Customization

### Current Template: `src/templates/emails/job-alert.hbs`
- Professional design with green theme
- Responsive layout
- Includes all job details
- Call-to-action button

### Customization Options
1. **Colors**: Modify CSS in the template
2. **Logo**: Add company logo in header
3. **Footer**: Update company information
4. **Content**: Modify job information display

## Security Best Practices

1. **Never commit .env files** to version control
2. **Use app passwords** instead of regular passwords
3. **Rotate credentials** regularly
4. **Monitor email sending** for abuse
5. **Implement rate limiting** for email endpoints
6. **Use environment-specific** email settings

## Next Steps

1. ✅ Create `.env` file with email configuration
2. ✅ Set up Gmail app password or other email provider
3. ✅ Fix template directory issue
4. ✅ Test email sending functionality
5. ✅ Monitor logs for successful email delivery
6. ✅ Set up production email service
