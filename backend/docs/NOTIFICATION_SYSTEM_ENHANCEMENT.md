# Notification System API Enhancement

## 📋 Overview

This document describes the comprehensive notification system enhancement for the X Career Backend API. The system provides in-app notifications for users with support for various notification types, priorities, and categories.

## 🎯 Features

### Core Features
- **User Notifications**: Get, read, and manage personal notifications
- **Notification Types**: Job alerts, subscription updates, payment notifications, system messages, profile updates, and application status
- **Priority Levels**: Low, medium, high, and urgent notifications
- **Categories**: Info, success, warning, and error notifications
- **Filtering & Pagination**: Advanced filtering by type, priority, category, and read status
- **Admin Management**: Create and manage notifications for users
- **Bulk Operations**: Create multiple notifications at once
- **Statistics**: Comprehensive notification analytics

### Notification Types
1. **Job Alert**: New job opportunities matching user profile
2. **Subscription**: Subscription status updates, renewals, cancellations
3. **Payment**: Payment success, failures, refunds
4. **System**: System-wide announcements and updates
5. **Profile**: Profile completion reminders and updates
6. **Application**: Job application status updates

## 🏗️ Architecture

### Database Schema
```typescript
interface INotification {
  _id: ObjectId;
  userId: ObjectId;
  type: 'job_alert' | 'subscription' | 'payment' | 'system' | 'profile' | 'application';
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  readAt?: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'info' | 'success' | 'warning' | 'error';
  actionUrl?: string;
  actionText?: string;
  expiresAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
```

### Key Components
- **Notification Model**: Mongoose schema with comprehensive validation
- **Notification Controller**: API endpoints for CRUD operations
- **Notification Service**: Business logic for automated notification creation
- **Notification Routes**: RESTful API endpoints with validation

## 📡 API Endpoints

### User Endpoints

#### Get User Notifications
```http
GET /api/v1/notifications
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `type`: Filter by notification type
- `priority`: Filter by priority level
- `category`: Filter by category
- `isRead`: Filter by read status
- `sortBy`: Sort field (createdAt, priority, type, category)
- `sortOrder`: Sort order (asc, desc)

**Response:**
```json
{
  "success": true,
  "data": {
    "notifications": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalNotifications": 100,
      "limit": 20
    },
    "statistics": {
      "total": 100,
      "unread": 15,
      "read": 85
    }
  }
}
```

#### Get Notification Statistics
```http
GET /api/v1/notifications/stats
Authorization: Bearer <jwt_token>
```

#### Mark Notification as Read
```http
PUT /api/v1/notifications/:notificationId/read
Authorization: Bearer <jwt_token>
```

#### Mark All Notifications as Read
```http
PUT /api/v1/notifications/read-all
Authorization: Bearer <jwt_token>
```

#### Delete Notification
```http
DELETE /api/v1/notifications/:notificationId
Authorization: Bearer <jwt_token>
```

### Admin Endpoints

#### Create Notification
```http
POST /api/v1/notifications
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "userId": "user_id_here",
  "type": "system",
  "title": "System Maintenance",
  "message": "The system will be under maintenance from 2-4 AM.",
  "priority": "high",
  "category": "warning",
  "actionUrl": "https://example.com/maintenance",
  "actionText": "Learn More",
  "expiresAt": "2024-12-31T23:59:59Z"
}
```

#### Bulk Create Notifications
```http
POST /api/v1/notifications/bulk
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "notifications": [
    {
      "userId": "user_id_1",
      "type": "job_alert",
      "title": "New Job Alert",
      "message": "A new job matching your profile has been posted.",
      "priority": "medium",
      "category": "info"
    },
    {
      "userId": "user_id_2",
      "type": "subscription",
      "title": "Subscription Update",
      "message": "Your subscription has been updated.",
      "priority": "low",
      "category": "success"
    }
  ]
}
```

## 🔧 Notification Service

The notification service provides automated notification creation for various system events:

### Job Alert Notifications
```typescript
await notificationService.createJobAlertNotification(userId, jobId);
```

### Subscription Notifications
```typescript
await notificationService.createSubscriptionNotification(
  userId, 
  'activated' | 'expired' | 'cancelled' | 'payment_failed' | 'renewal_reminder'
);
```

### Payment Notifications
```typescript
await notificationService.createPaymentNotification(
  userId, 
  'success' | 'failed' | 'refunded'
);
```

### Application Notifications
```typescript
await notificationService.createApplicationNotification(
  userId, 
  applicationId, 
  'applied' | 'shortlisted' | 'rejected' | 'withdrawn'
);
```

### System Notifications
```typescript
await notificationService.createSystemNotification(
  userId, 
  title, 
  message, 
  priority, 
  category
);
```

### Profile Notifications
```typescript
await notificationService.createProfileNotification(
  userId, 
  'incomplete' | 'complete' | 'update_required'
);
```

## 📊 Database Indexes

The notification system includes comprehensive indexing for optimal performance:

### Single Field Indexes
- `userId`: For user-specific queries
- `type`: For filtering by notification type
- `priority`: For priority-based filtering
- `category`: For category-based filtering
- `isRead`: For read status filtering
- `expiresAt`: TTL index for automatic cleanup

### Compound Indexes
- `{ userId: 1, isRead: 1 }`: User unread notifications
- `{ userId: 1, type: 1 }`: User notifications by type
- `{ userId: 1, priority: 1 }`: User notifications by priority
- `{ userId: 1, category: 1 }`: User notifications by category
- `{ userId: 1, createdAt: -1 }`: User notifications by creation date
- `{ type: 1, createdAt: -1 }`: Notifications by type and date

## 🧪 Testing

### Test Script
Run the comprehensive test suite:
```bash
cd backend
npx ts-node scripts/testNotificationSystem.ts
```

### Test Coverage
- ✅ User authentication and authorization
- ✅ Get user notifications with filtering
- ✅ Create notifications (admin)
- ✅ Mark notifications as read
- ✅ Mark all notifications as read
- ✅ Delete notifications
- ✅ Get notification statistics
- ✅ Bulk notification creation
- ✅ Notification filtering and pagination

## 🔒 Security

### Authentication
- All endpoints require JWT authentication
- User endpoints are restricted to the authenticated user
- Admin endpoints require admin or super_admin role

### Authorization
- Users can only access their own notifications
- Admins can create notifications for any user
- Proper validation for all input parameters

### Data Validation
- Comprehensive Joi validation for all endpoints
- Type checking for notification types, priorities, and categories
- Input sanitization and length limits

## 📈 Performance

### Optimization Features
- **Pagination**: Efficient pagination for large notification lists
- **Indexing**: Comprehensive database indexes for fast queries
- **TTL**: Automatic cleanup of expired notifications
- **Aggregation**: Efficient statistics calculation using MongoDB aggregation

### Monitoring
- Detailed logging for all notification operations
- Performance metrics for query execution
- Error tracking and alerting

## 🚀 Deployment

### Environment Variables
No additional environment variables required beyond existing JWT and database configuration.

### Database Migration
The notification system uses a new `Notification` collection. No migration required for existing data.

### Dependencies
- Existing dependencies are sufficient
- No additional packages required

## 📝 Usage Examples

### Creating a Job Alert Notification
```typescript
import { notificationService } from '../services/notificationService';

// When a new job is posted
await notificationService.createJobAlertNotification(userId, jobId);
```

### Creating a Subscription Notification
```typescript
// When subscription is activated
await notificationService.createSubscriptionNotification(userId, 'activated');

// When subscription expires
await notificationService.createSubscriptionNotification(userId, 'expired');
```

### Creating a Payment Notification
```typescript
// When payment succeeds
await notificationService.createPaymentNotification(userId, 'success');

// When payment fails
await notificationService.createPaymentNotification(userId, 'failed');
```

### Creating an Application Notification
```typescript
// When application is shortlisted
await notificationService.createApplicationNotification(userId, applicationId, 'shortlisted');

// When application is rejected
await notificationService.createApplicationNotification(userId, applicationId, 'rejected');
```

## 🔄 Integration Points

### Existing Systems
- **User Management**: Integrated with existing user authentication
- **Job Management**: Automatic job alert notifications
- **Subscription System**: Automatic subscription notifications
- **Payment System**: Automatic payment notifications
- **Application System**: Automatic application status notifications

### Future Enhancements
- **Push Notifications**: Mobile push notification support
- **Email Integration**: Email notification fallback
- **Real-time Updates**: WebSocket support for real-time notifications
- **Notification Preferences**: User-configurable notification settings

## 📋 API Documentation

### Complete Endpoint List

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/api/v1/notifications` | User | Get user notifications |
| GET | `/api/v1/notifications/stats` | User | Get notification statistics |
| PUT | `/api/v1/notifications/:id/read` | User | Mark notification as read |
| PUT | `/api/v1/notifications/read-all` | User | Mark all notifications as read |
| DELETE | `/api/v1/notifications/:id` | User | Delete notification |
| POST | `/api/v1/notifications` | Admin | Create notification |
| POST | `/api/v1/notifications/bulk` | Admin | Bulk create notifications |

### Response Format
All endpoints follow the standard API response format:
```json
{
  "success": boolean,
  "data": any,
  "error": {
    "message": string
  },
  "timestamp": string
}
```

## 🎉 Conclusion

The notification system enhancement provides a comprehensive solution for user notifications with:

- **Complete CRUD Operations**: Full notification management
- **Advanced Filtering**: Flexible querying and pagination
- **Automated Notifications**: Service-based notification creation
- **Admin Management**: Administrative notification control
- **Performance Optimized**: Efficient database operations
- **Security Focused**: Proper authentication and authorization
- **Well Tested**: Comprehensive test coverage

This system seamlessly integrates with existing X Career Backend functionality while providing a robust foundation for future notification features.
