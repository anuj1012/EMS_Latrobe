#!/bin/bash

# Production Deployment Script for Leave Approval System
# Usage: ./deploy.sh

set -e

echo "🚀 Starting production deployment..."

# Check if .env.prod exists
if [ ! -f ".env.prod" ]; then
    echo "❌ Error: .env.prod file not found!"
    echo "Please copy env.prod.template to .env.prod and fill in the values."
    exit 1
fi

# Load environment variables
export $(cat .env.prod | grep -v '^#' | xargs)

# Validate required environment variables
required_vars=("DATABASE_PASSWORD" "JWT_SECRET" "MINIO_SECRET_KEY" "CORS_ALLOWED_ORIGINS")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Error: Required environment variable $var is not set!"
        exit 1
    fi
done

echo "✅ Environment variables validated"

# Build and deploy with Docker Compose
echo "🐳 Building and deploying with Docker Compose..."

# Stop existing containers
docker-compose -f docker-compose.prod.yml down

# Build and start services
docker-compose -f docker-compose.prod.yml up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check health
echo "🔍 Checking service health..."
if curl -f http://localhost:8080/api/health > /dev/null 2>&1; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend health check failed"
    exit 1
fi

if curl -f http://localhost/health > /dev/null 2>&1; then
    echo "✅ Frontend is healthy"
else
    echo "❌ Frontend health check failed"
    exit 1
fi

echo "🎉 Deployment completed successfully!"
echo "📊 Services:"
echo "  - Frontend: http://localhost"
echo "  - Backend API: http://localhost:8080/api"
echo "  - MinIO Console: http://localhost:9001"
echo "  - Health Check: http://localhost:8080/api/health"






