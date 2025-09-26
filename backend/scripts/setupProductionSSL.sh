#!/bin/bash

# Production SSL Setup Script
# This script generates self-signed certificates for development/testing
# For production, replace with real certificates from a trusted CA

echo "🔐 Setting up SSL certificates for production deployment..."

# Create SSL directory
mkdir -p nginx/ssl

# Generate self-signed certificate (for development/testing)
openssl req -x509 -newkey rsa:4096 -keyout nginx/ssl/key.pem -out nginx/ssl/cert.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

echo "✅ SSL certificates generated successfully!"
echo "📁 Certificates location: nginx/ssl/"
echo "⚠️  Note: These are self-signed certificates for development only."
echo "🚀 For production, replace with certificates from a trusted CA (Let's Encrypt, etc.)"
