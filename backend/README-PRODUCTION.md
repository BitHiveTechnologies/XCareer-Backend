# NotifyX Backend - Production Deployment Guide

## 🚀 Production Deployment

This guide covers deploying the NotifyX backend to production using Docker and Docker Compose.

### Prerequisites

- Docker and Docker Compose installed
- MongoDB database (local or cloud)
- SSL certificates (for HTTPS)
- Environment variables configured

### Quick Start

1. **Clone and setup**:
   ```bash
   git clone <repository-url>
   cd X_Career_Backend/backend
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your production values
   ```

3. **Deploy to production**:
   ```bash
   ./scripts/deployProduction.sh
   ```

### Manual Deployment

1. **Build the application**:
   ```bash
   docker build -t notifyx-backend:latest .
   ```

2. **Setup SSL certificates**:
   ```bash
   ./scripts/setupProductionSSL.sh
   ```

3. **Start services**:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

### Environment Variables

Create a `.env` file with the following variables:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/notifyx

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d

# Bcrypt
BCRYPT_ROUNDS=12

# Server
PORT=3001
NODE_ENV=production

# CORS
CORS_ORIGIN=https://your-frontend-domain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Security
HELMET_CSP_ENABLED=true
HELMET_HSTS_ENABLED=true

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log

# Performance
ENABLE_QUERY_INTERCEPTOR=true
ENABLE_CACHING=true
CACHE_TTL=300

# Email (if using email notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Payment Gateway (if using payments)
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
```

### SSL Configuration

For production, replace the self-signed certificates with real ones:

1. **Using Let's Encrypt**:
   ```bash
   # Install certbot
   sudo apt-get install certbot
   
   # Generate certificates
   sudo certbot certonly --standalone -d your-domain.com
   
   # Copy certificates
   sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
   sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/key.pem
   ```

2. **Using your own certificates**:
   ```bash
   # Copy your certificates
   cp your-cert.pem nginx/ssl/cert.pem
   cp your-key.pem nginx/ssl/key.pem
   ```

### Monitoring

1. **Check application status**:
   ```bash
   ./scripts/monitorProduction.sh
   ```

2. **View logs**:
   ```bash
   docker-compose -f docker-compose.prod.yml logs -f
   ```

3. **Check health**:
   ```bash
   curl https://your-domain.com/health
   ```

### Performance Monitoring

Access performance statistics (requires admin authentication):

```bash
# Get admin token
ADMIN_TOKEN=$(curl -X POST https://your-domain.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@notifyx.com","password":"Admin123!"}' \
  | jq -r '.data.accessToken')

# Get performance stats
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://your-domain.com/api/v1/performance/stats
```

### Security Considerations

1. **Change default passwords**:
   - Update admin password
   - Use strong JWT secrets
   - Enable HTTPS only

2. **Database security**:
   - Use MongoDB authentication
   - Enable SSL for database connections
   - Regular backups

3. **Network security**:
   - Use firewall rules
   - Limit exposed ports
   - Use VPN for admin access

### Backup and Recovery

1. **Database backup**:
   ```bash
   # Create backup
   docker-compose -f docker-compose.prod.yml exec mongo mongodump --out /backup
   
   # Restore backup
   docker-compose -f docker-compose.prod.yml exec mongo mongorestore /backup
   ```

2. **Application backup**:
   ```bash
   # Backup application data
   docker-compose -f docker-compose.prod.yml exec notifyx-backend tar -czf /backup/app-data.tar.gz /app/data
   ```

### Troubleshooting

1. **Application won't start**:
   ```bash
   # Check logs
   docker-compose -f docker-compose.prod.yml logs notifyx-backend
   
   # Check environment variables
   docker-compose -f docker-compose.prod.yml exec notifyx-backend env
   ```

2. **Database connection issues**:
   ```bash
   # Test database connection
   docker-compose -f docker-compose.prod.yml exec notifyx-backend node -e "
   const mongoose = require('mongoose');
   mongoose.connect(process.env.MONGODB_URI)
     .then(() => console.log('✅ Connected'))
     .catch(err => console.log('❌ Failed:', err.message));
   "
   ```

3. **SSL certificate issues**:
   ```bash
   # Check certificate validity
   openssl x509 -in nginx/ssl/cert.pem -text -noout
   
   # Test SSL connection
   openssl s_client -connect your-domain.com:443
   ```

### Scaling

1. **Horizontal scaling**:
   ```bash
   # Scale backend service
   docker-compose -f docker-compose.prod.yml up -d --scale notifyx-backend=3
   ```

2. **Load balancing**:
   - Use multiple backend instances
   - Configure nginx upstream
   - Use external load balancer

### Maintenance

1. **Regular updates**:
   ```bash
   # Pull latest changes
   git pull origin main
   
   # Rebuild and restart
   docker-compose -f docker-compose.prod.yml down
   docker-compose -f docker-compose.prod.yml up -d --build
   ```

2. **Log rotation**:
   ```bash
   # Configure logrotate
   sudo nano /etc/logrotate.d/notifyx
   ```

### Support

For issues and support:

1. Check the logs: `docker-compose -f docker-compose.prod.yml logs`
2. Monitor performance: `./scripts/monitorProduction.sh`
3. Check health: `curl https://your-domain.com/health`

### API Documentation

Once deployed, access the API documentation at:
- **Health Check**: `https://your-domain.com/health`
- **API Info**: `https://your-domain.com/api/v1`
- **Performance Stats**: `https://your-domain.com/api/v1/performance/stats` (admin only)

---

**Note**: This is a production deployment guide. Always test in a staging environment first and ensure all security measures are in place before deploying to production.
