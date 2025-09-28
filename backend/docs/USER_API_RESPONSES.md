# 👤 User API Responses - Complete Reference

This document provides complete API responses for all user-related endpoints in the NotifyX system.

## 🔐 **Authentication Endpoints**

### **1. JWT Login**
```http
POST /api/v1/jwt-auth/login
Content-Type: application/json

{
  "email": "priyansh@example.com",
  "password": "password123"
}
```

**✅ Success Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user_1759055410144",
      "email": "priyansh@example.com",
      "firstName": "Test",
      "lastName": "User",
      "role": "user"
    }
  },
  "timestamp": "2025-09-28T10:30:10.146Z"
}
```

---

## 👤 **User Profile Endpoints**

### **2. Get Current User Profile**
```http
GET /api/v1/users/me
Authorization: Bearer <token>
```

**✅ Success Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "68d90e3ae81a436ffb331349",
      "clerkUserId": "jwt_user_1759055410144",
      "email": "priyansh@example.com",
      "name": "Test User",
      "mobile": "9876543210",
      "role": "user",
      "subscriptionPlan": "basic",
      "subscriptionStatus": "inactive",
      "isProfileComplete": false,
      "createdAt": "2025-09-28T10:30:18.709Z",
      "updatedAt": "2025-09-28T10:30:18.709Z",
      "profile": null
    }
  },
  "timestamp": "2025-09-28T10:32:24.063Z"
}
```

**❌ Error Response:**
```json
{
  "success": false,
  "error": {
    "message": "Authentication required"
  },
  "timestamp": "2025-09-28T10:32:24.063Z"
}
```

### **3. Get Profile Completion Status**
```http
GET /api/v1/users/me/completion
Authorization: Bearer <token>
```

**✅ Success Response:**
```json
{
  "success": true,
  "data": {
    "completionPercentage": 0,
    "isComplete": false,
    "missingFields": [
      "qualification",
      "stream", 
      "yearOfPassout",
      "cgpaOrPercentage",
      "collegeName"
    ],
    "totalFields": 5,
    "completedFields": 0
  },
  "timestamp": "2025-09-28T10:32:24.082Z"
}
```

**✅ Success Response (Partial Completion):**
```json
{
  "success": true,
  "data": {
    "completionPercentage": 60,
    "isComplete": false,
    "missingFields": [
      "cgpaOrPercentage",
      "collegeName"
    ],
    "totalFields": 5,
    "completedFields": 3,
    "profile": {
      "qualification": "B.Tech",
      "stream": "CSE",
      "yearOfPassout": 2023,
      "cgpaOrPercentage": null,
      "collegeName": null
    }
  },
  "timestamp": "2025-09-28T10:32:24.082Z"
}
```

**✅ Success Response (Complete Profile):**
```json
{
  "success": true,
  "data": {
    "completionPercentage": 100,
    "isComplete": true,
    "missingFields": [],
    "totalFields": 5,
    "completedFields": 5,
    "profile": {
      "qualification": "B.Tech",
      "stream": "CSE",
      "yearOfPassout": 2023,
      "cgpaOrPercentage": 8.5,
      "collegeName": "ABC University"
    }
  },
  "timestamp": "2025-09-28T10:32:24.082Z"
}
```

### **4. Update User Profile**
```http
PUT /api/v1/users/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name",
  "mobile": "9876543210",
  "qualification": "B.Tech",
  "stream": "CSE",
  "yearOfPassout": 2023,
  "cgpaOrPercentage": 8.5,
  "collegeName": "ABC University"
}
```

**✅ Success Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "id": "68d90e3ae81a436ffb331349",
      "clerkUserId": "jwt_user_1759055410144",
      "email": "priyansh@example.com",
      "name": "Updated Name",
      "mobile": "9876543210",
      "role": "user",
      "subscriptionPlan": "basic",
      "subscriptionStatus": "inactive",
      "isProfileComplete": true,
      "profile": {
        "userId": "68d90e3ae81a436ffb331349",
        "firstName": "Test",
        "lastName": "User",
        "email": "priyansh@example.com",
        "contactNumber": "9876543210",
        "dateOfBirth": "1995-01-01T00:00:00.000Z",
        "qualification": "B.Tech",
        "stream": "CSE",
        "yearOfPassout": 2023,
        "cgpaOrPercentage": 8.5,
        "collegeName": "ABC University",
        "createdAt": "2025-09-28T10:35:00.000Z",
        "updatedAt": "2025-09-28T10:35:00.000Z"
      }
    }
  },
  "timestamp": "2025-09-28T10:35:00.000Z"
}
```

---

## 📋 **Required Registration Fields**

### **User Account (Required):**
```json
{
  "email": "user@example.com",           // ✅ Required - Valid email format
  "name": "User Name",                   // ✅ Required - 2-100 characters
  "mobile": "9876543210",               // ✅ Required - Indian mobile (10 digits)
  "password": "password123"              // ✅ Required - Min 8 characters (if not using Clerk)
}
```

### **User Profile (Required for Job Matching):**
```json
{
  "firstName": "John",                   // ✅ Required - 1-50 characters
  "lastName": "Doe",                    // ✅ Required - 1-50 characters
  "email": "user@example.com",          // ✅ Required - Valid email format
  "contactNumber": "9876543210",        // ✅ Required - Indian mobile (10 digits)
  "dateOfBirth": "1995-01-01",         // ✅ Required - Must be 16+ years old
  "qualification": "B.Tech",            // ✅ Required - See options below
  "stream": "CSE",                      // ✅ Required - See options below
  "yearOfPassout": 2023,                // ✅ Required - 2000-2030
  "cgpaOrPercentage": 8.5,              // ✅ Required - 0-10 (CGPA) or 0-100 (Percentage)
  "collegeName": "ABC University"       // ✅ Required - 1-200 characters
}
```

### **Qualification Options:**
```javascript
const qualifications = [
  '10th', '12th', 'Diploma', 'B.E', 'B.Tech', 'B.Sc', 'B.Com', 'BBA', 'BCA',
  'M.E', 'M.Tech', 'M.Sc', 'M.Com', 'MBA', 'MCA', 'PhD', 'Others'
];
```

### **Stream Options:**
```javascript
const streams = [
  'CSE', 'IT', 'ECE', 'EEE', 'ME', 'CE', 'Chemical', 'Biotech', 'Civil',
  'Mechanical', 'Electrical', 'Computer Science', 'Information Technology',
  'Electronics', 'Others'
];
```

---

## 🎯 **Profile Completion Logic**

### **Completion Calculation:**
The system calculates profile completion based on **5 core fields**:

1. **`qualification`** - Academic qualification
2. **`stream`** - Academic stream/course  
3. **`yearOfPassout`** - Graduation year
4. **`cgpaOrPercentage`** - Academic performance
5. **`collegeName`** - Institution name

### **Completion Percentage:**
- **0%** - No profile fields completed
- **20%** - 1 field completed (20% each)
- **40%** - 2 fields completed
- **60%** - 3 fields completed
- **80%** - 4 fields completed
- **100%** - All 5 fields completed

### **Job Matching Eligibility:**
- ✅ Only users with `isProfileComplete: true` get job alerts
- ✅ Profile completion is required for job matching
- ✅ Percentage-based matching uses profile data
- ✅ CGPA, qualification, stream, year used for matching

---

## 🚀 **Frontend Integration Examples**

### **React Hook for Profile Completion:**
```typescript
import { useState, useEffect } from 'react';

interface ProfileCompletion {
  completionPercentage: number;
  isComplete: boolean;
  missingFields: string[];
  totalFields: number;
  completedFields: number;
}

export const useProfileCompletion = () => {
  const [completion, setCompletion] = useState<ProfileCompletion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchCompletion = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/v1/users/me/completion', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setCompletion(data.data);
        setError(null);
      } else {
        setError(data.error.message);
      }
    } catch (err) {
      setError('Failed to fetch profile completion');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchCompletion();
  }, []);
  
  return { completion, loading, error, refetch: fetchCompletion };
};
```

### **Profile Completion Widget:**
```typescript
import React from 'react';
import { useProfileCompletion } from './hooks/useProfileCompletion';

const ProfileCompletionWidget = () => {
  const { completion, loading, error } = useProfileCompletion();
  
  if (loading) return <div>Loading profile completion...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!completion) return <div>No completion data available</div>;
  
  return (
    <div className="profile-completion-widget">
      <div className="completion-header">
        <h3>Profile Completion: {completion.completionPercentage}%</h3>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${completion.completionPercentage}%` }}
          />
        </div>
      </div>
      
      {!completion.isComplete && (
        <div className="missing-fields">
          <h4>Complete these fields:</h4>
          <ul>
            {completion.missingFields.map(field => (
              <li key={field}>
                {field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {completion.isComplete && (
        <div className="completion-success">
          ✅ Your profile is complete! You're eligible for job alerts.
        </div>
      )}
    </div>
  );
};

export default ProfileCompletionWidget;
```

---

## ✅ **System Status**

### **Working Endpoints:**
- ✅ `/api/v1/jwt-auth/login` - JWT authentication
- ✅ `/api/v1/users/me` - Get user profile
- ✅ `/api/v1/users/me/completion` - Profile completion status
- ✅ `/api/v1/users/me` (PUT) - Update user profile

### **Profile Completion System:**
- ✅ Calculates percentage based on 5 core fields
- ✅ Tracks missing fields for user guidance
- ✅ Updates `isProfileComplete` flag automatically
- ✅ Used for job matching eligibility

### **Job Alert Integration:**
- ✅ Only users with complete profiles get job alerts
- ✅ Percentage-based matching uses profile data
- ✅ Enhanced matching algorithm implemented

**Your user registration and profile completion system is fully functional and ready for frontend integration!**
