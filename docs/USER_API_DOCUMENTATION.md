# User API Documentation

This document provides comprehensive information about the User API endpoints, including field requirements, validation rules, and examples.

## Table of Contents

- [Authentication](#authentication)
- [User Registration](#user-registration)
- [User Profile Management](#user-profile-management)
- [API Endpoints](#api-endpoints)
- [Field Specifications](#field-specifications)
- [Response Examples](#response-examples)
- [Error Handling](#error-handling)

## Authentication

All user endpoints require JWT authentication. Include the token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

### Getting a JWT Token

```http
POST /api/v1/jwt-auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "role": "user",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user_1234567890",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user"
    }
  }
}
```

## User Registration

### Automatic User Creation

Users are automatically created when they first authenticate via JWT. No separate registration endpoint is required.

**Required Fields for User Creation:**
- `email` (string, unique, valid email format)
- `name` (string, max 100 characters)
- `mobile` (string, valid Indian mobile number: 6-9 followed by 9 digits)

**Optional Fields:**
- `clerkUserId` (string, for external auth)
- `password` (string, min 8 characters - required only if not using Clerk)
- `role` (enum: 'user', 'admin', 'super_admin' - defaults to 'user')
- `subscriptionPlan` (enum: 'basic', 'premium' - defaults to 'basic')
- `subscriptionStatus` (enum: 'active', 'inactive', 'expired' - defaults to 'inactive')

## User Profile Management

### Profile Fields

User profiles contain detailed information beyond basic user data. Profiles are created automatically when users update their information.

**Required Profile Fields:**
- `firstName` (string, max 50 characters)
- `lastName` (string, max 50 characters)
- `email` (string, valid email format)
- `contactNumber` (string, valid Indian mobile number)
- `dateOfBirth` (Date, user must be at least 16 years old)
- `qualification` (enum - see valid values below)
- `stream` (enum - see valid values below)
- `yearOfPassout` (number, 2000-2030)
- `cgpaOrPercentage` (number, 0-10 for CGPA, 0-100 for percentage)
- `collegeName` (string, max 200 characters)

**Optional Profile Fields:**
- `customQualification` (string, required if qualification = 'Others')
- `customStream` (string, required if stream = 'Others')
- `skills` (string, max 500 characters)
- `linkedinUrl` (string, valid URL)
- `githubUrl` (string, valid URL)
- `address` (string, max 500 characters)
- `city` (string, max 100 characters)
- `state` (string, max 100 characters)
- `pincode` (string, 6-digit Indian pincode)

## API Endpoints

### 1. Get Current User Profile

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
      "id": "68d287e0c91a12b7de99bdad",
      "clerkUserId": "jwt_user_1758627791209",
      "email": "alice.wilson@example.com",
      "name": "Alice Wilson",
      "mobile": "9876543215",
      "role": "user",
      "subscriptionPlan": "basic",
      "subscriptionStatus": "inactive",
      "isProfileComplete": true,
      "createdAt": "2025-09-23T11:43:28.161Z",
      "updatedAt": "2025-09-23T11:43:28.168Z",
      "profile": {
        "_id": "68d287e0c91a12b7de99bdb1",
        "userId": "68d287e0c91a12b7de99bdad",
        "firstName": "Alice",
        "lastName": "Wilson",
        "email": "alice.wilson@example.com",
        "contactNumber": "9876543215",
        "dateOfBirth": "1995-01-01T00:00:00.000Z",
        "qualification": "B.Tech",
        "stream": "Computer Science",
        "yearOfPassout": 2023,
        "cgpaOrPercentage": 8.7,
        "collegeName": "IIT Bombay",
        "createdAt": "2025-09-23T11:43:28.167Z",
        "updatedAt": "2025-09-23T11:43:28.167Z",
        "fullName": "Alice Wilson",
        "age": 30,
        "qualificationDisplay": "B.Tech",
        "streamDisplay": "Computer Science"
      }
    }
  },
  "timestamp": "2025-09-23T11:43:34.851Z"
}
```

### 2. Update Current User Profile

```http
PUT /api/v1/users/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Alice Wilson",
  "mobile": "9876543215",
  "qualification": "B.Tech",
  "stream": "Computer Science",
  "yearOfPassout": 2023,
  "cgpaOrPercentage": 8.7,
  "collegeName": "IIT Bombay",
  "skills": "JavaScript, React, Node.js, Python, MongoDB",
  "linkedinUrl": "https://linkedin.com/in/alice-wilson",
  "githubUrl": "https://github.com/alice-wilson"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "id": "68d287e0c91a12b7de99bdad",
      "email": "alice.wilson@example.com",
      "name": "Alice Wilson",
      "mobile": "9876543215",
      "isProfileComplete": true,
      "profile": {
        "qualification": "B.Tech",
        "stream": "Computer Science",
        "yearOfPassout": 2023,
        "cgpaOrPercentage": 8.7,
        "collegeName": "IIT Bombay"
      }
    }
  }
}
```

### 3. Get Profile Completion Status

```http
GET /api/v1/users/me/completion
Authorization: Bearer <token>
```

**Response:**
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
      "stream": "Computer Science",
      "yearOfPassout": 2023,
      "cgpaOrPercentage": 8.7,
      "collegeName": "IIT Bombay"
    }
  }
}
```

### 4. Get User Profile by ID

```http
GET /api/v1/users/profile/:userId
Authorization: Bearer <token>
```

**Response:** Same structure as `/api/v1/users/me`

### 5. Update User Profile by ID

```http
PUT /api/v1/users/profile/:userId
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name",
  "qualification": "M.Tech",
  "stream": "IT"
}
```

**Response:** Same structure as update current user

## Field Specifications

### Qualification Enum Values

```json
[
  "10th",
  "12th",
  "Diploma",
  "B.E",
  "B.Tech",
  "B.Sc",
  "B.Com",
  "BBA",
  "BCA",
  "M.E",
  "M.Tech",
  "M.Sc",
  "M.Com",
  "MBA",
  "MCA",
  "PhD",
  "Others"
]
```

### Stream Enum Values

```json
[
  "CSE",
  "IT",
  "ECE",
  "EEE",
  "ME",
  "CE",
  "Chemical",
  "Biotech",
  "Civil",
  "Mechanical",
  "Electrical",
  "Computer Science",
  "Information Technology",
  "Electronics",
  "Others"
]
```

### Validation Rules

| Field | Type | Validation Rules |
|-------|------|------------------|
| `email` | string | Valid email format, unique |
| `mobile` | string | Indian mobile number (6-9 followed by 9 digits) |
| `name` | string | Max 100 characters |
| `firstName` | string | Max 50 characters |
| `lastName` | string | Max 50 characters |
| `dateOfBirth` | Date | User must be at least 16 years old |
| `qualification` | string | Must be from enum values |
| `stream` | string | Must be from enum values |
| `yearOfPassout` | number | 2000-2030 |
| `cgpaOrPercentage` | number | 0-10 for CGPA, 0-100 for percentage |
| `collegeName` | string | Max 200 characters |
| `skills` | string | Max 500 characters |
| `linkedinUrl` | string | Valid URL format |
| `githubUrl` | string | Valid URL format |
| `address` | string | Max 500 characters |
| `city` | string | Max 100 characters |
| `state` | string | Max 100 characters |
| `pincode` | string | 6-digit Indian pincode |

## Response Examples

### Complete User Profile Response

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "68d287e0c91a12b7de99bdad",
      "email": "alice.wilson@example.com",
      "name": "Alice Wilson",
      "mobile": "9876543215",
      "role": "user",
      "subscriptionPlan": "basic",
      "subscriptionStatus": "inactive",
      "isProfileComplete": true,
      "createdAt": "2025-09-23T11:43:28.161Z",
      "updatedAt": "2025-09-23T11:43:28.168Z",
      "profile": {
        "_id": "68d287e0c91a12b7de99bdb1",
        "userId": "68d287e0c91a12b7de99bdad",
        "firstName": "Alice",
        "lastName": "Wilson",
        "email": "alice.wilson@example.com",
        "contactNumber": "9876543215",
        "dateOfBirth": "1995-01-01T00:00:00.000Z",
        "qualification": "B.Tech",
        "stream": "Computer Science",
        "yearOfPassout": 2023,
        "cgpaOrPercentage": 8.7,
        "collegeName": "IIT Bombay",
        "skills": "JavaScript, React, Node.js, Python, MongoDB",
        "linkedinUrl": "https://linkedin.com/in/alice-wilson",
        "githubUrl": "https://github.com/alice-wilson",
        "address": "123 Tech Street, Mumbai",
        "city": "Mumbai",
        "state": "Maharashtra",
        "pincode": "400001",
        "createdAt": "2025-09-23T11:43:28.167Z",
        "updatedAt": "2025-09-23T11:43:28.167Z",
        "fullName": "Alice Wilson",
        "age": 30,
        "qualificationDisplay": "B.Tech",
        "streamDisplay": "Computer Science"
      }
    }
  },
  "timestamp": "2025-09-23T11:43:34.851Z"
}
```

### Profile Completion Response

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
      "stream": "Computer Science",
      "yearOfPassout": 2023,
      "cgpaOrPercentage": 8.7,
      "collegeName": "IIT Bombay"
    }
  }
}
```

## Error Handling

### Common Error Responses

#### 401 Unauthorized
```json
{
  "success": false,
  "error": {
    "message": "Authorization header with Bearer token is required"
  },
  "timestamp": "2025-09-23T11:45:25.698Z"
}
```

#### 400 Bad Request - Validation Error
```json
{
  "success": false,
  "error": {
    "message": "UserProfile validation failed: qualification: Please select a valid qualification"
  },
  "timestamp": "2025-09-23T11:39:22.006Z"
}
```

#### 404 Not Found
```json
{
  "success": false,
  "error": {
    "message": "User not found"
  },
  "timestamp": "2025-09-23T11:45:25.698Z"
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "error": {
    "message": "Failed to update current user profile"
  },
  "timestamp": "2025-09-23T11:45:25.698Z"
}
```

## Usage Examples

### Complete User Flow

1. **Login to get JWT token:**
```bash
curl -X POST http://localhost:3001/api/v1/jwt-auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "role": "user",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

2. **Get current user profile:**
```bash
curl -X GET http://localhost:3001/api/v1/users/me \
  -H "Authorization: Bearer <token>"
```

3. **Update user profile:**
```bash
curl -X PUT http://localhost:3001/api/v1/users/me \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "mobile": "9876543210",
    "qualification": "B.Tech",
    "stream": "Computer Science",
    "yearOfPassout": 2023,
    "cgpaOrPercentage": 8.5,
    "collegeName": "IIT Delhi"
  }'
```

4. **Check profile completion:**
```bash
curl -X GET http://localhost:3001/api/v1/users/me/completion \
  -H "Authorization: Bearer <token>"
```

## Notes

- All timestamps are in ISO 8601 format
- User IDs are MongoDB ObjectIds
- Profile completion is calculated based on required fields: qualification, stream, yearOfPassout, cgpaOrPercentage, collegeName
- Custom qualification/stream fields are required when "Others" is selected
- Age is automatically calculated from dateOfBirth
- Full name is automatically generated from firstName and lastName
- All string fields are trimmed of whitespace
- Email addresses are converted to lowercase
- Mobile numbers must be valid Indian mobile numbers

## Support

For API support or questions, please contact the development team or refer to the main API documentation.
