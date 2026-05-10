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
# Build the project
npm run build

# Start production server
npm start
```

## 📁 Project Structure

```
src/
├── __tests__/       # Automated unit and integration tests
│   ├── unit/        # Unit tests for controllers, services, models
│   └── integration/ # End-to-end API testing
├── config/          # Configuration and environment setup
├── controllers/     # Business logic for API endpoints
├── middleware/      # Authentication, validation, and security middleware
├── models/          # Mongoose database schemas
├── routes/          # Express route definitions
├── services/        # Third-party integrations (Email, Payment)
├── utils/           # Shared utility functions (Logger, Error types)
└── index.ts         # Application entry point
```

## 🔧 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript to production-ready JavaScript
- `npm start` - Run the compiled production server
- `npm test` - Run the automated test suite using Jest
- `npm run clean` - Clear build artifacts and caches
- `npm run seed:test-data` - Seed the database with mock users and jobs

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

## 🚀 Deployment (Railway)

1. **Setup Railway**: Connect your GitHub repository to Railway.app.
2. **Environment Variables**: Add the variables from `.env.example` to the Railway project settings.
3. **Automatic Build**: Railway will detect the `package.json` and run `npm run build` followed by `npm start`.
4. **Database**: Use the Railway MongoDB plugin or provide an external `MONGODB_URI`.

### Build Checklist
- [ ] Run `npm run build` locally to check for TS errors.
- [ ] Run `npm test` to ensure security logic is intact.
- [ ] Verify `FRONTEND_URL` in Railway matches your deployed website.

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
