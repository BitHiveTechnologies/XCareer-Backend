# 📧 Job Alert System API Reference

## Overview
Complete API reference for integrating the job alert system with your frontend UI.

## 🔐 Authentication
All admin endpoints require authentication:
```
Authorization: Bearer <admin_token>
```

## 📊 **Admin Dashboard APIs**

### 1. Get Job Alert Statistics
```http
GET /api/v1/jobs/alerts/statistics
GET /api/v1/jobs/alerts/statistics?jobId=SPECIFIC_JOB_ID
```

**Response:**
```json
{
  "success": true,
  "data": {
    "statistics": {
      "totalNotifications": 15,
      "sentNotifications": 12,
      "failedNotifications": 1,
      "pendingNotifications": 2,
      "averageMatchScore": 0,
      "topMatchReasons": []
    },
    "jobId": "all"
  },
  "timestamp": "2025-09-28T08:00:00.000Z"
}
```

### 2. Send Job Alerts for Specific Job
```http
POST /api/v1/jobs/alerts/send/:jobId
Content-Type: application/json

{
  "minMatchScore": 50,
  "maxUsers": 100,
  "dryRun": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Job alerts sent successfully",
  "data": {
    "jobId": "68d8ec3d4219298af1bd6934",
    "stats": {
      "totalEligibleUsers": 5,
      "emailsSent": 3,
      "emailsFailed": 0,
      "duplicateNotifications": 2,
      "usersWithoutProfile": 0,
      "usersWithInactiveSubscription": 0
    },
    "dryRun": false
  }
}
```

### 3. Send Alerts for All Active Jobs
```http
POST /api/v1/jobs/alerts/send-all
Content-Type: application/json

{
  "minMatchScore": 50,
  "maxUsersPerJob": 50,
  "dryRun": false
}
```

### 4. Retry Failed Notifications
```http
POST /api/v1/jobs/alerts/retry-failed
Content-Type: application/json

{
  "jobId": "optional-job-id"
}
```

### 5. Get Scheduler Status
```http
GET /api/v1/jobs/alerts/scheduler/status
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": {
      "enabled": false,
      "jobAlertTask": false,
      "retryFailedTask": false,
      "config": {
        "jobAlertSchedule": "0 9 * * *",
        "retryFailedSchedule": "0 */6 * * *"
      }
    }
  }
}
```

### 6. Trigger Scheduler Tasks
```http
POST /api/v1/jobs/alerts/scheduler/trigger
Content-Type: application/json

{
  "task": "jobAlerts",
  "dryRun": false
}
```

## 🎯 **For UI Integration:**

### **Admin Dashboard Components Needed:**

#### 1. **Job Alert Statistics Widget**
```typescript
interface JobAlertStats {
  totalNotifications: number;
  sentNotifications: number;
  failedNotifications: number;
  pendingNotifications: number;
  averageMatchScore: number;
}

// Usage in React:
const [stats, setStats] = useState<JobAlertStats>();

useEffect(() => {
  fetch('/api/v1/jobs/alerts/statistics', {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  })
  .then(res => res.json())
  .then(data => setStats(data.data.statistics));
}, []);
```

#### 2. **Job Alert Trigger Panel**
```typescript
const triggerJobAlerts = async (jobId: string) => {
  const response = await fetch(`/api/v1/jobs/alerts/send/${jobId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      minMatchScore: 50,
      maxUsers: 100,
      dryRun: false
    })
  });
  
  const result = await response.json();
  console.log('Job alerts sent:', result.data.stats);
};
```

#### 3. **Scheduler Control Panel**
```typescript
const getSchedulerStatus = async () => {
  const response = await fetch('/api/v1/jobs/alerts/scheduler/status', {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  return response.json();
};

const triggerSchedulerTask = async (task: 'jobAlerts' | 'retryFailed') => {
  const response = await fetch('/api/v1/jobs/alerts/scheduler/trigger', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ task, dryRun: false })
  });
  return response.json();
};
```

## 🔧 **Optional Enhancements for UI:**

### **For Better User Experience:**

#### 1. **User Notification Preferences** (Not implemented yet)
```typescript
// Add to User model:
interface NotificationPreferences {
  jobAlerts: boolean;
  emailFrequency: 'immediate' | 'daily' | 'weekly';
  minimumMatchScore: number;
  preferredJobTypes: string[];
  preferredLocations: string[];
}
```

#### 2. **Job Alert History for Users** (Not implemented yet)
```http
GET /api/v1/users/notifications/history
Authorization: Bearer <user_token>
```

#### 3. **Unsubscribe Functionality** (Not implemented yet)
```http
POST /api/v1/users/notifications/unsubscribe
POST /api/v1/users/notifications/preferences
```

## 🚀 **Ready for Production:**

### **What Works Right Now:**
1. ✅ **Admin can trigger job alerts** via API
2. ✅ **Percentage-based matching** (50% minimum)
3. ✅ **Professional email templates** with match scores
4. ✅ **Duplicate prevention** system
5. ✅ **Statistics and monitoring** endpoints
6. ✅ **Email delivery** confirmed working

### **Automatic Scheduling** (Optional):
If you want automatic daily job alerts, enable the scheduler:
```typescript
// In your admin UI, call:
POST /api/v1/jobs/alerts/scheduler/trigger
{
  "task": "jobAlerts",
  "dryRun": false
}
```

## 📋 **Integration Checklist:**

### **For Admin Dashboard:**
- [ ] Add job alert statistics widget
- [ ] Add "Send Alerts" button for each job
- [ ] Add scheduler control panel
- [ ] Add failed notifications retry button

### **For User Dashboard:** (Optional)
- [ ] Show job alert history
- [ ] Allow notification preferences
- [ ] Show match percentages for recommended jobs

### **Environment Setup:**
- [x] ✅ Email SMTP configured
- [x] ✅ Database models ready
- [x] ✅ API endpoints working
- [x] ✅ Email templates loaded

## 🎯 **Your System is Ready!**

The job alert system will work perfectly with your UI. You can:

1. **Integrate admin controls** using the provided API endpoints
2. **Display statistics** in your admin dashboard
3. **Trigger job alerts** when new jobs are posted
4. **Monitor delivery** through the statistics endpoints

The percentage-based matching logic you requested is fully implemented and working with your exact requirements:
- ✅ 50% minimum match threshold
- ✅ CGPA, skills, course, passing year matching
- ✅ Detailed percentage tracking
- ✅ Enhanced email templates with match details

**Your job alert system is production-ready!**
