# CORS Fix Guide

## 🚀 What Was Fixed

The CORS (Cross-Origin Resource Sharing) configuration has been completely updated to resolve the frontend connection issues.

### Changes Made:

1. **Enhanced CORS Configuration** (`src/index.ts`):
   - Added support for multiple origins (localhost:3000, 3001, 3002, etc.)
   - Added proper preflight request handling
   - Added development mode debugging
   - Added comprehensive header support

2. **Environment Configuration** (`src/config/environment.ts`):
   - Added `ADMIN_FRONTEND_URL` support
   - Better environment variable handling

3. **Added CORS Test Endpoint**:
   - New endpoint: `GET /cors-test` for testing CORS functionality

## 🧪 Testing the Fix

### 1. Start the Backend Server
```bash
cd backend
npm run dev
```

### 2. Test CORS with the Test Script
```bash
npm run test:cors
```

### 3. Test from Browser Console
Open your frontend (localhost:3000) and run this in the browser console:

```javascript
// Test basic CORS
fetch('http://localhost:5000/cors-test')
  .then(response => response.json())
  .then(data => console.log('CORS Test:', data))
  .catch(error => console.error('CORS Error:', error));

// Test jobs endpoint
fetch('http://localhost:5000/api/v1/jobs?page=1&limit=10&type=job')
  .then(response => response.json())
  .then(data => console.log('Jobs Test:', data))
  .catch(error => console.error('Jobs Error:', error));
```

### 4. Test from Frontend Application
Your frontend should now be able to make requests to:
- `GET /api/v1/jobs` - Get all jobs
- `GET /api/v1/jobs/search` - Search jobs
- `GET /api/v1/auth/login` - User login
- `POST /api/v1/admin/login` - Admin login
- All other API endpoints

## 🔧 CORS Configuration Details

### Allowed Origins:
- `http://localhost:3000` (Main frontend)
- `http://localhost:3001` (Admin frontend)
- `http://localhost:3002` (Additional dev ports)
- `http://127.0.0.1:3000` (Alternative localhost)
- `http://127.0.0.1:3001`
- `http://127.0.0.1:3002`
- Environment variables: `FRONTEND_URL`, `ADMIN_FRONTEND_URL`

### Allowed Methods:
- GET, POST, PUT, DELETE, PATCH, OPTIONS

### Allowed Headers:
- Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma

### Special Features:
- **Credentials**: Enabled for authentication
- **Preflight Handling**: Explicit OPTIONS request handling
- **Development Mode**: Allows any localhost origin in development
- **Debug Logging**: Shows CORS requests in development mode

## 🐛 Troubleshooting

### If CORS still fails:

1. **Check the backend logs** for CORS debug messages
2. **Verify the frontend URL** matches the allowed origins
3. **Clear browser cache** and hard refresh
4. **Check for typos** in the frontend API calls
5. **Verify the backend is running** on port 5000

### Common Issues:

1. **Wrong Port**: Make sure backend is on port 5000
2. **HTTPS vs HTTP**: Make sure both use the same protocol
3. **Trailing Slashes**: Check URL formatting
4. **Browser Cache**: Clear cache and cookies

## 📝 Environment Variables

Create a `.env` file in the backend directory with:

```env
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000
ADMIN_FRONTEND_URL=http://localhost:3001
```

## ✅ Verification Checklist

- [ ] Backend server starts without errors
- [ ] CORS test endpoint returns success
- [ ] Frontend can fetch jobs data
- [ ] No CORS errors in browser console
- [ ] Network tab shows successful requests
- [ ] Preflight requests return 200 status

## 🎯 Next Steps

1. **Test the frontend** - Your jobs page should now load successfully
2. **Test authentication** - Login functionality should work
3. **Test all API endpoints** - Verify all features work
4. **Deploy to production** - Update CORS origins for production URLs

The CORS issue should now be completely resolved! 🚀

