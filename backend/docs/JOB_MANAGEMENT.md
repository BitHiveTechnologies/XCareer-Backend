# Job and Internship Management System

This document describes the job and internship management system implementation for the NotifyX Backend.

## Overview

The job and internship management system provides comprehensive functionality for posting, managing, searching, and applying to jobs and internships. It includes subscription-based access control, advanced filtering, and complete application lifecycle management.

## Features

- **Job Posting Management**: Create, update, delete, and manage job postings
- **Internship Support**: Dedicated internship posting and management
- **Advanced Search & Filtering**: Multi-criteria job search with pagination
- **Subscription-Based Access**: Premium and enterprise features for subscribers
- **Application Management**: Complete job application lifecycle
- **Admin Controls**: Comprehensive admin dashboard and statistics
- **Eligibility Management**: Detailed eligibility criteria and validation
- **Status Tracking**: Real-time application status updates

## Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Frontend  │───▶│   Backend   │───▶│  Database   │
│             │    │             │    │             │
└─────────────┘    └─────────────┘    └─────────────┘
                          │
                          ▼
                   ┌─────────────┐
                   │ Job & App   │
                   │ Management  │
                   └─────────────┘
```

## Job Types

### Regular Jobs
- **Full-time positions** with salary information
- **Part-time opportunities** with flexible schedules
- **Contract positions** with specific durations
- **Remote, onsite, and hybrid** work arrangements

### Internships
- **Summer internships** for students
- **Semester-based** opportunities
- **Paid and unpaid** positions
- **Academic credit** support

## API Endpoints

### Job Management

#### 1. Get All Jobs
```http
GET /v1/jobs?page=1&limit=10&type=job&location=remote&search=developer
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `type`: Job type ('job' or 'internship')
- `location`: Work location ('remote', 'onsite', 'hybrid')
- `qualification`: Required qualification
- `stream`: Academic stream
- `yearOfPassout`: Graduation year
- `minCGPA`: Minimum CGPA requirement
- `search`: Text search in title, company, description
- `sortBy`: Sort field (default: 'createdAt')
- `sortOrder`: Sort direction ('asc' or 'desc')

**Response:**
```json
{
  "success": true,
  "data": {
    "jobs": [
      {
        "id": "job_id",
        "title": "Software Developer",
        "company": "Tech Corp",
        "type": "job",
        "location": "remote",
        "salary": "$80,000 - $120,000",
        "applicationDeadline": "2024-03-15T00:00:00.000Z",
        "eligibility": {
          "qualifications": ["B.Tech", "M.Tech"],
          "streams": ["CSE", "IT"],
          "passoutYears": [2023, 2024],
          "minCGPA": 7.5
        },
        "postedBy": {
          "id": "admin_id",
          "name": "Admin User",
          "email": "admin@techcorp.com"
        },
        "createdAt": "2024-02-01T00:00:00.000Z",
        "isActive": true
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "pages": 1
    }
  }
}
```

#### 2. Get Job by ID
```http
GET /v1/jobs/:jobId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "job": {
      "id": "job_id",
      "title": "Software Developer",
      "company": "Tech Corp",
      "description": "Full job description...",
      "type": "job",
      "location": "remote",
      "salary": "$80,000 - $120,000",
      "stipend": null,
      "applicationDeadline": "2024-03-15T00:00:00.000Z",
      "eligibility": {...},
      "postedBy": {...},
      "createdAt": "2024-02-01T00:00:00.000Z",
      "isActive": true,
      "applications": [...]
    }
  }
}
```

#### 3. Create Job (Admin Only)
```http
POST /v1/jobs
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Software Developer",
  "company": "Tech Corp",
  "description": "We are looking for a talented developer...",
  "type": "job",
  "eligibility": {
    "qualifications": ["B.Tech", "M.Tech"],
    "streams": ["CSE", "IT"],
    "passoutYears": [2023, 2024],
    "minCGPA": 7.5
  },
  "applicationDeadline": "2024-03-15T00:00:00.000Z",
  "applicationLink": "https://techcorp.com/careers",
  "location": "remote",
  "salary": "$80,000 - $120,000"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Job created successfully",
  "data": {
    "job": {
      "id": "job_id",
      "title": "Software Developer",
      "company": "Tech Corp",
      "type": "job",
      "location": "remote",
      "isActive": true,
      "createdAt": "2024-02-01T00:00:00.000Z"
    }
  }
}
```

#### 4. Update Job (Admin Only)
```http
PUT /v1/jobs/:jobId
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Senior Software Developer",
  "salary": "$100,000 - $150,000"
}
```

#### 5. Delete Job (Admin Only)
```http
DELETE /v1/jobs/:jobId
Authorization: Bearer <token>
```

#### 6. Toggle Job Status (Admin Only)
```http
PATCH /v1/jobs/:jobId/toggle-status
Authorization: Bearer <token>
```

#### 7. Get Job Statistics (Admin Only)
```http
GET /v1/jobs/stats/overview
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalJobs": 150,
      "activeJobs": 120,
      "inactiveJobs": 30,
      "internshipJobs": 45,
      "regularJobs": 75
    },
    "locationDistribution": [
      {
        "_id": "remote",
        "count": 60
      }
    ],
    "monthlyTrends": [...],
    "qualificationDistribution": [...]
  }
}
```

### Job Search

#### Advanced Search
```http
GET /v1/jobs/search?query=developer&type=job&location=remote&qualifications=B.Tech&minCGPA=7.0
```

**Query Parameters:**
- `query`: Text search query
- `type`: Job type filter
- `location`: Location filter
- `qualifications`: Array of qualifications
- `streams`: Array of academic streams
- `passoutYears`: Array of graduation years
- `minCGPA`: Minimum CGPA
- `maxCGPA`: Maximum CGPA
- `salary`: Filter jobs with salary
- `stipend`: Filter jobs with stipend
- `remote`: Filter remote jobs only
- `page`: Page number
- `limit`: Items per page

### Job Applications

#### 1. Apply for a Job
```http
POST /v1/applications/:jobId/apply
Authorization: Bearer <token>
Content-Type: application/json

{
  "resumeUrl": "https://example.com/resume.pdf",
  "coverLetter": "I am excited to apply for this position..."
}
```

#### 2. Get User Applications
```http
GET /v1/applications/my-applications?page=1&limit=10&status=applied
Authorization: Bearer <token>
```

#### 3. Withdraw Application
```http
PATCH /v1/applications/:applicationId/withdraw
Authorization: Bearer <token>
```

#### 4. Get Job Applications (Admin Only)
```http
GET /v1/applications/job/:jobId/applications?page=1&limit=10&status=applied
Authorization: Bearer <token>
```

#### 5. Update Application Status (Admin Only)
```http
PATCH /v1/applications/:applicationId/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "shortlisted",
  "adminNotes": "Strong candidate with relevant experience"
}
```

#### 6. Get Application Statistics (Admin Only)
```http
GET /v1/applications/stats/overview
Authorization: Bearer <token>
```

## Subscription-Based Access Control

### Basic Users
- **Access**: Internships and basic jobs only
- **Limitations**: Cannot access premium/enterprise jobs
- **Features**: Basic job search and application

### Premium Users
- **Access**: All jobs including premium features
- **Features**: Advanced search, priority job matching
- **Benefits**: Enhanced job recommendations

### Enterprise Users
- **Access**: All jobs including enterprise features
- **Features**: Custom integrations, advanced analytics
- **Benefits**: Dedicated support and reporting

## Job Eligibility System

### Qualification Requirements
```typescript
eligibility: {
  qualifications: ['B.Tech', 'M.Tech', 'MCA'],
  streams: ['CSE', 'IT', 'ECE'],
  passoutYears: [2023, 2024, 2025],
  minCGPA: 7.5
}
```

### Validation Rules
- **Qualifications**: Must be from predefined list
- **Streams**: Academic streams that match requirements
- **Passout Years**: Graduation years within valid range
- **CGPA**: Minimum academic performance requirement

## Application Lifecycle

### 1. Application Submitted
- **Status**: 'applied'
- **Actions**: Admin review, user can withdraw
- **Notifications**: Admin receives application alert

### 2. Under Review
- **Status**: 'applied' (admin reviewing)
- **Actions**: Admin can shortlist, reject, or request more info
- **User Actions**: Can withdraw application

### 3. Shortlisted
- **Status**: 'shortlisted'
- **Actions**: Admin can proceed to next round
- **User Actions**: Cannot withdraw, must respond to admin

### 4. Rejected
- **Status**: 'rejected'
- **Actions**: Admin provides feedback
- **User Actions**: Can view feedback, cannot reapply

### 5. Withdrawn
- **Status**: 'withdrawn'
- **Actions**: User-initiated withdrawal
- **Admin Actions**: Cannot change status

## Admin Dashboard Features

### Job Management
- **Create/Edit Jobs**: Full CRUD operations
- **Status Control**: Activate/deactivate jobs
- **Bulk Operations**: Manage multiple jobs
- **Analytics**: Job performance metrics

### Application Management
- **Review Applications**: Process incoming applications
- **Status Updates**: Update application status
- **Communication**: Add notes and feedback
- **Statistics**: Application trends and metrics

### User Management
- **Applicant Profiles**: View user details
- **Communication**: Send notifications
- **Access Control**: Manage user permissions

## Search and Filtering

### Text Search
- **Title Search**: Job title matching
- **Company Search**: Company name matching
- **Description Search**: Full-text search in job description

### Advanced Filters
- **Location**: Remote, onsite, hybrid
- **Type**: Job or internship
- **Qualifications**: Required academic qualifications
- **Streams**: Academic streams
- **Passout Years**: Graduation years
- **CGPA Range**: Academic performance
- **Salary**: Jobs with salary information
- **Stipend**: Jobs with stipend information

### Sorting Options
- **Date Posted**: Newest/oldest first
- **Application Deadline**: Soonest/latest deadline
- **Company Name**: Alphabetical order
- **Job Title**: Alphabetical order

## Data Models

### Job Schema
```typescript
interface IJob {
  _id: ObjectId;
  title: string;
  company: string;
  description: string;
  type: 'job' | 'internship';
  eligibility: {
    qualifications: string[];
    streams: string[];
    passoutYears: number[];
    minCGPA?: number;
  };
  applicationDeadline: Date;
  applicationLink: string;
  location: 'remote' | 'onsite' | 'hybrid';
  salary?: string;
  stipend?: string;
  isActive: boolean;
  postedBy: ObjectId;
  applications?: ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}
```

### Job Application Schema
```typescript
interface IJobApplication {
  _id: ObjectId;
  jobId: ObjectId;
  userId: ObjectId;
  status: 'applied' | 'shortlisted' | 'rejected' | 'withdrawn';
  appliedAt: Date;
  resumeUrl: string;
  coverLetter?: string;
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## Security Features

### Authentication & Authorization
- **JWT Tokens**: Secure user authentication
- **Role-Based Access**: Admin vs. user permissions
- **Ownership Validation**: Users can only modify their own content

### Input Validation
- **Schema Validation**: Joi-based input validation
- **Data Sanitization**: Prevent injection attacks
- **Type Safety**: TypeScript interfaces and validation

### Access Control
- **Subscription Checks**: Feature access based on user plan
- **Admin Verification**: Admin-only operations protected
- **User Isolation**: Users can only access their own data

## Error Handling

### Common Error Scenarios

1. **Job Not Found**
   ```json
   {
     "success": false,
     "error": {
       "message": "Job not found"
     }
   }
   ```

2. **Access Denied**
   ```json
   {
     "success": false,
     "error": {
       "message": "Premium subscription required to access this job"
     }
   }
   ```

3. **Already Applied**
   ```json
   {
     "success": false,
     "error": {
       "message": "You have already applied for this job"
     }
   }
   ```

4. **Application Deadline Passed**
   ```json
   {
     "success": false,
     "error": {
       "message": "Application deadline has passed"
     }
   }
   ```

### Error Logging
- **Structured Logging**: All errors logged with context
- **User Tracking**: Error logs include user information
- **Debug Information**: Detailed error messages for developers

## Performance Optimization

### Database Indexes
```typescript
// Job model indexes
jobSchema.index({ isActive: 1 });
jobSchema.index({ type: 1 });
jobSchema.index({ location: 1 });
jobSchema.index({ 'eligibility.qualifications': 1 });
jobSchema.index({ 'eligibility.streams': 1 });
jobSchema.index({ applicationDeadline: 1 });
jobSchema.index({ createdAt: -1 });
jobSchema.index({ postedBy: 1 });

// Application model indexes
applicationSchema.index({ jobId: 1 });
applicationSchema.index({ userId: 1 });
applicationSchema.index({ status: 1 });
applicationSchema.index({ appliedAt: -1 });
```

### Query Optimization
- **Pagination**: Efficient large dataset handling
- **Selective Population**: Only load required fields
- **Aggregation Pipelines**: Optimized statistics queries
- **Compound Queries**: Efficient multi-field searches

## Monitoring & Analytics

### Key Metrics
- **Job Posting Rate**: New jobs per day/week
- **Application Volume**: Applications per job
- **Conversion Rates**: Application to shortlist ratio
- **User Engagement**: Job views and applications

### Performance Monitoring
- **Response Times**: API endpoint performance
- **Error Rates**: Error frequency and types
- **Database Performance**: Query execution times
- **User Experience**: Search result relevance

## Future Enhancements

1. **AI-Powered Matching**: Smart job-candidate matching
2. **Resume Parsing**: Automatic skill extraction
3. **Interview Scheduling**: Integrated interview management
4. **Skill Assessment**: Automated skill testing
5. **Referral System**: Employee referral tracking
6. **Analytics Dashboard**: Advanced reporting tools
7. **Mobile App**: Native mobile application
8. **Integration APIs**: Third-party system integration

## Troubleshooting

### Common Issues

1. **Job Not Appearing in Search**
   - Check if job is active
   - Verify user subscription level
   - Check search filters and criteria

2. **Application Not Submitting**
   - Verify job is still active
   - Check application deadline
   - Ensure user hasn't already applied

3. **Admin Access Issues**
   - Verify admin role permissions
   - Check job ownership
   - Validate authentication token

### Debug Steps

1. Check application logs for errors
2. Verify database connectivity
3. Test individual endpoints
4. Check user permissions and subscription
5. Validate input data and schemas

## Support

For job management system issues:
1. Check job status and visibility
2. Verify user permissions and subscription
3. Review application requirements
4. Contact development team

## References

- [Job Management Best Practices](https://example.com)
- [Recruitment System Guidelines](https://example.com)
- [HR Technology Standards](https://example.com)
