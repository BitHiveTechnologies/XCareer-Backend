#!/bin/bash

# Production Deployment Script
# This script deploys the NotifyX backend to production

echo "🚀 Starting Production Deployment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose and try again."
    exit 1
fi

# Set production environment
export NODE_ENV=production

# Build production image
echo "🔨 Building production Docker image..."
docker build -t notifyx-backend:latest .

if [ $? -ne 0 ]; then
    echo "❌ Failed to build Docker image"
    exit 1
fi

# Setup SSL certificates
echo "🔐 Setting up SSL certificates..."
./scripts/setupProductionSSL.sh

if [ $? -ne 0 ]; then
    echo "❌ Failed to setup SSL certificates"
    exit 1
fi

# Start production services
echo "🚀 Starting production services..."
docker-compose -f docker-compose.prod.yml up -d

if [ $? -ne 0 ]; then
    echo "❌ Failed to start production services"
    exit 1
fi

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Health check
echo "🏥 Performing health check..."
curl -f http://localhost/health

if [ $? -eq 0 ]; then
    echo "✅ Production deployment successful!"
    echo "🌐 Application is running at: https://localhost"
    echo "📊 Health check: https://localhost/health"
    echo "📋 API documentation: https://localhost/api/v1"
else
    echo "❌ Health check failed. Please check the logs:"
    echo "   docker-compose -f docker-compose.prod.yml logs"
fi

echo "🎉 Production deployment completed!"
