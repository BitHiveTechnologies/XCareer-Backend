# NotifyX Backend

A robust, scalable backend system for the NotifyX job notification platform. Built with Node.js, Express, TypeScript, and MongoDB.

## 🚀 Features

- **User Management**: Complete user registration, authentication, and profile management
- **Subscription System**: Razorpay payment integration with subscription lifecycle management
- **Job Matching**: Intelligent algorithm for matching users with relevant job opportunities
- **Email Notifications**: Automated email system for job alerts and user communications
- **Admin Dashboard**: Comprehensive admin panel with analytics and user management
- **Security**: JWT authentication, rate limiting, input validation, and security headers
- **Performance**: Optimized database queries, connection pooling, and monitoring

## 🛠️ Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens with bcrypt password hashing
- **Payment**: Razorpay integration
- **Email**: NodeMailer with SMTP support
- **Security**: Helmet.js, CORS, rate limiting, input validation
- **Logging**: Custom logger with configurable levels
- **Validation**: Joi schema validation

## 📋 Prerequisites

- Node.js (v18 or higher)
- MongoDB (v5 or higher)
- npm or yarn package manager

## 🚀 Quick Start

### 1. Clone and Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Configuration

Copy the environment template and configure your variables:

```bash
cp env.template .env
```

Edit `.env` with your configuration:
- MongoDB connection string
- JWT secrets
- Razorpay API keys
- Email service credentials

### 3. Development

```bash
# Start development server with hot reload
npm run dev

# Build and start production server
npm run dev:build
```

### 4. Production Build

```bash
# Build the project (cleans dist, compiles TypeScript, copies assets)
npm run build

# Build for production with NODE_ENV=production
npm run build:production

# Start production server
npm start

# Start production server with NODE_ENV=production
npm run start:prod
```

**Build Process:**
- `prebuild`: Automatically cleans the `dist` directory
- `build`: Compiles TypeScript and copies static assets (templates, etc.)
- `postbuild`: Verifies the build was successful
- Output: All compiled JavaScript files in `dist/` directory

## 📁 Project Structure

```
src/
├── config/          # Configuration files
│   ├── database.ts  # MongoDB connection
│   └── environment.ts # Environment variables
├── controllers/     # Route controllers
├── middleware/      # Custom middleware
│   ├── errorHandler.ts
│   ├── notFound.ts
│   ├── rateLimiter.ts
│   └── validation.ts
├── models/          # Database models
├── routes/          # API routes
├── utils/           # Utility functions
│   └── logger.ts    # Logging utility
└── index.ts         # Main application entry point
```

## 🔧 Available Scripts

### Development
- `npm run dev` - Start development server with hot reload (nodemon + ts-node)
- `npm run dev:build` - Build and start in development mode

### Building
- `npm run build` - Build TypeScript to JavaScript (includes prebuild clean and postbuild verification)
- `npm run build:production` - Build with NODE_ENV=production
- `npm run clean` - Remove build artifacts (dist directory)
- `npm run verify:build` - Verify build output exists

### Production
- `npm start` - Start production server (runs `dist/index.js`)
- `npm run start:prod` - Start with NODE_ENV=production

### Testing & Utilities
- `npm run seed:test-data` - Seed test data
- `npm run create:admin` - Create admin user
- `npm run fix:indexes` - Fix database indexes

## 🌐 API Endpoints

### Health Check
- `GET /health` - Server health status

### Base API
- `GET /api` - API status check

## 🔒 Security Features

- **Helmet.js**: Security headers
- **CORS**: Cross-origin resource sharing configuration
- **Rate Limiting**: API request throttling
- **Input Validation**: Joi schema validation
- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with configurable rounds

## 📊 Monitoring & Logging

- **Request Logging**: HTTP request/response logging
- **Error Logging**: Comprehensive error tracking
- **Database Logging**: Database operation monitoring
- **Payment Logging**: Payment transaction tracking
- **Email Logging**: Email delivery status

## 🗄️ Database

- **MongoDB**: NoSQL database with Mongoose ODM
- **Connection Pooling**: Optimized database connections
- **Indexing**: Performance-optimized database queries
- **Validation**: Schema-level data validation

## 🧪 Testing

Testing framework setup coming soon:
- Unit tests for business logic
- Integration tests for API endpoints
- Database transaction testing
- Minimum 80% code coverage target

## 🚀 Deployment

### Docker Deployment

The project includes a production-ready Dockerfile:

```bash
# Build Docker image
docker build -f Dockerfile.prod -t notifyx-backend:latest .

# Run container
docker run -p 3001:3001 --env-file .env notifyx-backend:latest
```

**Docker Build Process:**
1. **Builder Stage**: Installs all dependencies (including devDependencies for TypeScript)
2. **Builder Stage**: Compiles TypeScript and copies static assets
3. **Production Stage**: Installs only production dependencies
4. **Production Stage**: Copies only the `dist` directory (optimized image size)

### Build Features
- ✅ Cross-platform build script (works on Windows, macOS, Linux)
- ✅ Automatic cleanup of old build artifacts
- ✅ Static asset copying (templates, etc.)
- ✅ Build verification to ensure successful compilation
- ✅ Optimized Docker builds with multi-stage builds
- ✅ Production-ready with proper environment handling

### Deployment Checklist
- [ ] Set all required environment variables
- [ ] Run `npm run build` to verify build works locally
- [ ] Test production build with `npm run start:prod`
- [ ] Build Docker image and test container
- [ ] Configure production database connection
- [ ] Set up monitoring and logging
- [ ] Configure reverse proxy (nginx) if needed

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/notifyx` |
| `JWT_SECRET` | JWT signing secret | Required in production |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |
| `RAZORPAY_KEY_ID` | Razorpay API key ID | Required |
| `RAZORPAY_KEY_SECRET` | Razorpay API secret | Required |

## 🤝 Contributing

1. Follow the existing code style
2. Add tests for new features
3. Update documentation as needed
4. Ensure all tests pass before submitting

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For support and questions, please refer to the project documentation or create an issue in the repository.
