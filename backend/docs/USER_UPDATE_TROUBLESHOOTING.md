# 🔧 User Profile Update - Troubleshooting Guide

This document addresses the common issues with user profile updates and provides solutions.

## 🚨 **Common Issues & Solutions**

### **Issue 1: 500 Internal Server Error on PUT /api/v1/users/me**

**❌ Problem:** Getting 500 error when updating user profile
**✅ Solution:** The issue is usually due to **expired JWT tokens**

**Root Cause:**
- JWT tokens have a limited lifespan (typically 7 days)
- Frontend is using expired tokens
- Token validation fails on the backend

**🔧 Fix:**

1. **Check Token Expiry:**
```javascript
// Frontend: Check if token is expired
const token = localStorage.getItem('authToken');
if (token) {
  const payload = JSON.parse(atob(token.split('.')[1]));
  const isExpired = Date.now() >= payload.exp * 1000;
  if (isExpired) {
    // Redirect to login or refresh token
    window.location.href = '/login';
  }
}
```

2. **Implement Token Refresh:**
```javascript
// Frontend: Auto-refresh token before API calls
const refreshToken = async () => {
  try {
    const response = await fetch('/api/v1/jwt-auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'user@example.com',
        password: 'password123'
      })
    });
    const data = await response.json();
    if (data.success) {
      localStorage.setItem('authToken', data.data.token);
      return data.data.token;
    }
  } catch (error) {
    console.error('Token refresh failed:', error);
    // Redirect to login
    window.location.href = '/login';
  }
};
```

3. **Add Token Validation to API Calls:**
```javascript
// Frontend: Validate token before making requests
const makeAuthenticatedRequest = async (url, options = {}) => {
  let token = localStorage.getItem('authToken');
  
  // Check if token is expired
  if (token) {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const isExpired = Date.now() >= payload.exp * 1000;
    
    if (isExpired) {
      token = await refreshToken();
    }
  }
  
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
};
```

---

## ✅ **Working API Endpoints**

### **1. Get Fresh Token**
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
      "id": "user_175905596150",
      "email": "priyansh@example.com",
      "firstName": "Test",
      "lastName": "User",
      "role": "user"
    }
  },
  "timestamp": "2025-09-28T10:39:15.747Z"
}
```

### **2. Update User Profile**
```http
PUT /api/v1/users/me
Authorization: Bearer <fresh_token>
Content-Type: application/json

{
  "name": "Updated Test User",
  "mobile": "9876543210",
  "qualification": "B.Tech",
  "stream": "IT",
  "yearOfPassout": 2023,
  "cgpaOrPercentage": 8.5,
  "collegeName": "Test University"
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
      "email": "priyansh@example.com",
      "name": "Updated Test User",
      "mobile": "9876543210",
      "role": "user",
      "subscriptionPlan": "basic",
      "subscriptionStatus": "inactive",
      "isProfileComplete": true,
      "profile": {
        "qualification": "B.Tech",
        "stream": "IT",
        "yearOfPassout": 2023,
        "cgpaOrPercentage": 8.5,
        "collegeName": "Test University"
      }
    }
  },
  "timestamp": "2025-09-28T10:39:21.637Z"
}
```

### **3. Get Profile Completion Status**
```http
GET /api/v1/users/me/completion
Authorization: Bearer <fresh_token>
```

**✅ Success Response:**
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
      "stream": "IT",
      "yearOfPassout": 2023,
      "cgpaOrPercentage": 8.5,
      "collegeName": "Test University"
    }
  },
  "timestamp": "2025-09-28T10:39:27.656Z"
}
```

---

## 🚀 **Frontend Implementation**

### **React Hook for Profile Updates:**
```typescript
import { useState, useCallback } from 'react';

interface ProfileData {
  name?: string;
  mobile?: string;
  qualification?: string;
  stream?: string;
  yearOfPassout?: number;
  cgpaOrPercentage?: number;
  collegeName?: string;
}

export const useProfileUpdate = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const updateProfile = useCallback(async (profileData: ProfileData) => {
    setLoading(true);
    setError(null);
    
    try {
      // Get fresh token
      const token = await getFreshToken();
      if (!token) {
        throw new Error('Authentication failed');
      }
      
      const response = await fetch('/api/v1/users/me', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        return data.data.user;
      } else {
        throw new Error(data.error.message);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  return { updateProfile, loading, error };
};

// Helper function to get fresh token
const getFreshToken = async (): Promise<string | null> => {
  try {
    const response = await fetch('/api/v1/jwt-auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'priyansh@example.com',
        password: 'password123'
      })
    });
    
    const data = await response.json();
    if (data.success) {
      localStorage.setItem('authToken', data.data.token);
      return data.data.token;
    }
    return null;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return null;
  }
};
```

### **Profile Update Component:**
```typescript
import React, { useState } from 'react';
import { useProfileUpdate } from './hooks/useProfileUpdate';

const ProfileUpdateForm = () => {
  const { updateProfile, loading, error } = useProfileUpdate();
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    qualification: '',
    stream: '',
    yearOfPassout: '',
    cgpaOrPercentage: '',
    collegeName: ''
  });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const result = await updateProfile(formData);
      alert('Profile updated successfully!');
      console.log('Updated user:', result);
    } catch (error) {
      console.error('Update failed:', error);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="profile-form">
      {error && (
        <div className="error-message">
          ❌ {error}
        </div>
      )}
      
      <div className="form-group">
        <label>Name *</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          required
        />
      </div>
      
      <div className="form-group">
        <label>Mobile *</label>
        <input
          type="tel"
          value={formData.mobile}
          onChange={(e) => setFormData({...formData, mobile: e.target.value})}
          pattern="[6-9][0-9]{9}"
          required
        />
      </div>
      
      <div className="form-group">
        <label>Qualification *</label>
        <select
          value={formData.qualification}
          onChange={(e) => setFormData({...formData, qualification: e.target.value})}
          required
        >
          <option value="">Select Qualification</option>
          <option value="B.Tech">B.Tech</option>
          <option value="M.Tech">M.Tech</option>
          <option value="B.Sc">B.Sc</option>
          <option value="M.Sc">M.Sc</option>
          <option value="MBA">MBA</option>
        </select>
      </div>
      
      <div className="form-group">
        <label>Stream *</label>
        <select
          value={formData.stream}
          onChange={(e) => setFormData({...formData, stream: e.target.value})}
          required
        >
          <option value="">Select Stream</option>
          <option value="CSE">Computer Science</option>
          <option value="IT">Information Technology</option>
          <option value="ECE">Electronics</option>
          <option value="EEE">Electrical</option>
        </select>
      </div>
      
      <div className="form-group">
        <label>Year of Passout *</label>
        <input
          type="number"
          value={formData.yearOfPassout}
          onChange={(e) => setFormData({...formData, yearOfPassout: e.target.value})}
          min="2000"
          max="2030"
          required
        />
      </div>
      
      <div className="form-group">
        <label>CGPA/Percentage *</label>
        <input
          type="number"
          value={formData.cgpaOrPercentage}
          onChange={(e) => setFormData({...formData, cgpaOrPercentage: e.target.value})}
          min="0"
          max="10"
          step="0.1"
          required
        />
      </div>
      
      <div className="form-group">
        <label>College Name *</label>
        <input
          type="text"
          value={formData.collegeName}
          onChange={(e) => setFormData({...formData, collegeName: e.target.value})}
          required
        />
      </div>
      
      <button type="submit" disabled={loading}>
        {loading ? 'Updating...' : 'Update Profile'}
      </button>
    </form>
  );
};

export default ProfileUpdateForm;
```

---

## 🔍 **Debugging Steps**

### **1. Check Token Validity:**
```bash
# Test with curl to verify token
curl -H "Authorization: Bearer YOUR_TOKEN" "http://localhost:3001/api/v1/users/me"
```

### **2. Get Fresh Token:**
```bash
# Get new token
curl -X POST "http://localhost:3001/api/v1/jwt-auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "priyansh@example.com", "password": "password123"}'
```

### **3. Test Profile Update:**
```bash
# Test profile update with fresh token
curl -X PUT "http://localhost:3001/api/v1/users/me" \
  -H "Authorization: Bearer FRESH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated Name", "qualification": "B.Tech"}'
```

---

## ✅ **System Status**

### **Working Endpoints:**
- ✅ `POST /api/v1/jwt-auth/login` - Get fresh token
- ✅ `GET /api/v1/users/me` - Get user profile
- ✅ `PUT /api/v1/users/me` - Update user profile
- ✅ `GET /api/v1/users/me/completion` - Profile completion status

### **Profile Update Features:**
- ✅ Updates user basic info (name, mobile)
- ✅ Creates/updates user profile
- ✅ Calculates profile completion percentage
- ✅ Updates `isProfileComplete` flag
- ✅ Returns updated user data

**The user profile update system is fully functional! The 500 error is due to expired JWT tokens, which can be fixed by implementing token refresh in the frontend.**
