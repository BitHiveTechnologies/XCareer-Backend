#!/bin/bash

# Production Monitoring Script
# This script monitors the production deployment

echo "📊 Production Monitoring Dashboard"
echo "================================"

# Check Docker containers
echo "🐳 Docker Containers Status:"
docker-compose -f docker-compose.prod.yml ps

echo ""

# Check application health
echo "🏥 Application Health:"
curl -s http://localhost/health | jq '.' 2>/dev/null || curl -s http://localhost/health

echo ""

# Check performance stats (requires admin token)
echo "⚡ Performance Statistics:"
echo "   (Admin authentication required for detailed stats)"
echo "   Use: curl -H 'Authorization: Bearer <admin-token>' http://localhost/api/v1/performance/stats"

echo ""

# Check logs
echo "📋 Recent Logs (last 50 lines):"
docker-compose -f docker-compose.prod.yml logs --tail=50

echo ""

# System resources
echo "💻 System Resources:"
echo "   CPU Usage: $(top -l 1 | grep "CPU usage" | awk '{print $3}')"
echo "   Memory Usage: $(top -l 1 | grep "PhysMem" | awk '{print $2}')"
echo "   Disk Usage: $(df -h / | awk 'NR==2{print $5}')"

echo ""

# Database connection
echo "🗄️ Database Status:"
docker-compose -f docker-compose.prod.yml exec notifyx-backend node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/notifyx')
  .then(() => console.log('✅ Database connected'))
  .catch(err => console.log('❌ Database connection failed:', err.message));
"

echo ""
echo "🎯 Monitoring completed!"
echo "   For detailed monitoring, use: docker-compose -f docker-compose.prod.yml logs -f"
