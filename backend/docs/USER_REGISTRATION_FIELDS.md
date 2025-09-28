# 👤 User Registration Fields - Complete Guide

This document outlines all the required and optional fields for user registration in the NotifyX system.

## 🔐 **User Registration Requirements**

### **Required Fields for User Account:**

| Field | Type | Validation | Description |
|-------|------|------------|-------------|
| `email` | String | Valid email format, unique | User's email address |
| `name` | String | 2-100 characters | Full name of the user |
| `mobile` | String | Indian mobile number (10 digits starting with 6-9) | Contact number |
| `password` | String | Min 8 characters (if not using Clerk) | Account password |

### **Optional Fields (Auto-generated):**
- `role` - Default: "user"
- `subscriptionPlan` - Default: "basic" 
- `subscriptionStatus` - Default: "inactive"
- `isProfileComplete` - Default: false

---

## 📋 **User Profile Fields (Required for Job Matching)**

### **Personal Information:**

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `firstName` | String | ✅ Yes | 1-50 characters | First name |
| `lastName` | String | ✅ Yes | 1-50 characters | Last name |
| `email` | String | ✅ Yes | Valid email format | Email address |
| `contactNumber` | String | ✅ Yes | Indian mobile (10 digits) | Contact number |
| `dateOfBirth` | Date | ✅ Yes | Must be 16+ years old | Date of birth |

### **Education Information:**

| Field | Type | Required | Options | Description |
|-------|------|----------|---------|-------------|
| `qualification` | String | ✅ Yes | See options below | Highest qualification |
| `customQualification` | String | ✅ If "Others" | 1-100 characters | Custom qualification |
| `stream` | String | ✅ Yes | See options below | Academic stream |
| `customStream` | String | ✅ If "Others" | 1-100 characters | Custom stream |
| `yearOfPassout` | Number | ✅ Yes | 2000-2030 | Graduation year |
| `cgpaOrPercentage` | Number | ✅ Yes | 0-10 (CGPA) or 0-100 (Percentage) | Academic performance |
| `collegeName` | String | ✅ Yes | 1-200 characters | College/University name |

### **Qualification Options:**
```
'10th', '12th', 'Diploma', 'B.E', 'B.Tech', 'B.Sc', 'B.Com', 'BBA', 'BCA', 
'M.E', 'M.Tech', 'M.Sc', 'M.Com', 'MBA', 'MCA', 'PhD', 'Others'
```

### **Stream Options:**
```
'CSE', 'IT', 'ECE', 'EEE', 'ME', 'CE', 'Chemical', 'Biotech', 'Civil', 
'Mechanical', 'Electrical', 'Computer Science', 'Information Technology', 
'Electronics', 'Others'
```

---

## 🎯 **Profile Completion System**

### **Completion Calculation:**
The system calculates profile completion based on **5 core fields**:
1. `qualification` - Academic qualification
2. `stream` - Academic stream/course
3. `yearOfPassout` - Graduation year
4. `cgpaOrPercentage` - Academic performance
5. `collegeName` - Institution name

### **Completion Percentage:**
- **0%** - No profile fields completed
- **20%** - 1 field completed
- **40%** - 2 fields completed
- **60%** - 3 fields completed
- **80%** - 4 fields completed
- **100%** - All 5 fields completed

---

## 🔗 **API Endpoints for Profile Management**

### **1. Get Current User Profile**
```http
GET /api/v1/users/me
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "name": "User Name",
      "mobile": "9876543210",
      "role": "user",
      "subscriptionPlan": "basic",
      "subscriptionStatus": "inactive",
      "isProfileComplete": false,
      "profile": {
        "firstName": "John",
        "lastName": "Doe",
        "qualification": "B.Tech",
        "stream": "CSE",
        "yearOfPassout": 2023,
        "cgpaOrPercentage": 8.5,
        "collegeName": "ABC University"
      }
    }
  }
}
```

### **2. Get Profile Completion Status**
```http
GET /api/v1/users/me/completion
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "completionPercentage": 80,
    "isComplete": false,
    "missingFields": ["collegeName"],
    "totalFields": 5,
    "completedFields": 4,
    "profile": {
      "qualification": "B.Tech",
      "stream": "CSE", 
      "yearOfPassout": 2023,
      "cgpaOrPercentage": 8.5,
      "collegeName": null
    }
  }
}
```

### **3. Update User Profile**
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

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "name": "Updated Name",
      "isProfileComplete": true,
      "profile": {
        "qualification": "B.Tech",
        "stream": "CSE",
        "yearOfPassout": 2023,
        "cgpaOrPercentage": 8.5,
        "collegeName": "ABC University"
      }
    }
  }
}
```

---

## 🚀 **Frontend Integration Examples**

### **React Component for Profile Completion:**

```typescript
import React, { useState, useEffect } from 'react';

interface ProfileCompletion {
  completionPercentage: number;
  isComplete: boolean;
  missingFields: string[];
  totalFields: number;
  completedFields: number;
}

const ProfileCompletionWidget = () => {
  const [completion, setCompletion] = useState<ProfileCompletion | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchProfileCompletion();
  }, []);
  
  const fetchProfileCompletion = async () => {
    try {
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
      }
    } catch (error) {
      console.error('Failed to fetch profile completion:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) return <div>Loading...</div>;
  if (!completion) return <div>Error loading profile completion</div>;
  
  return (
    <div className="profile-completion">
      <h3>Profile Completion: {completion.completionPercentage}%</h3>
      
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${completion.completionPercentage}%` }}
        />
      </div>
      
      {!completion.isComplete && (
        <div className="missing-fields">
          <p>Complete these fields to finish your profile:</p>
          <ul>
            {completion.missingFields.map(field => (
              <li key={field}>{field}</li>
            ))}
          </ul>
        </div>
      )}
      
      {completion.isComplete && (
        <div className="completion-success">
          ✅ Your profile is complete!
        </div>
      )}
    </div>
  );
};

export default ProfileCompletionWidget;
```

### **Profile Form Component:**

```typescript
import React, { useState } from 'react';

const ProfileForm = () => {
  const [formData, setFormData] = useState({
    qualification: '',
    stream: '',
    yearOfPassout: '',
    cgpaOrPercentage: '',
    collegeName: ''
  });
  
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/v1/users/me', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      if (data.success) {
        alert('Profile updated successfully!');
        // Refresh the page or update state
        window.location.reload();
      } else {
        alert('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="profile-form">
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
          <option value="Others">Others</option>
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
          <option value="Others">Others</option>
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

export default ProfileForm;
```

---

## ✅ **System Status**

### **Working Endpoints:**
- ✅ `/api/v1/users/me/completion` - Profile completion status
- ✅ `/api/v1/users/me` - Get user profile (with some issues)
- ✅ `/api/v1/users/me` (PUT) - Update user profile

### **Profile Completion Logic:**
- ✅ Calculates percentage based on 5 core fields
- ✅ Tracks missing fields for user guidance
- ✅ Updates `isProfileComplete` flag automatically
- ✅ Used for job matching eligibility

### **Job Matching Integration:**
- ✅ Only users with `isProfileComplete: true` get job alerts
- ✅ Percentage-based matching uses profile data
- ✅ CGPA, qualification, stream, year used for matching

---

## 🎯 **Next Steps for Frontend Integration:**

1. **Add Profile Completion Widget** to user dashboard
2. **Create Profile Form** with all required fields
3. **Implement Progress Tracking** with visual indicators
4. **Add Validation** for all form fields
5. **Connect to Job Matching** system

**Your profile completion system is ready for UI integration!**
