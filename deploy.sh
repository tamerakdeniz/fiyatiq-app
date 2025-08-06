#!/bin/bash

# FiyatIQ Production Deployment Script
# Server: 64.226.67.215
# Domain: fiyatiq.wxcodesign.com

set -e

echo "🚀 Starting FiyatIQ Production Deployment..."

# Check if .env file exists
if [ ! -f "backend/.env" ]; then
    echo "❌ Error: backend/.env file not found!"
    echo "Please create backend/.env file with your Gemini API key:"
    echo "GEMINI_API_KEY=your_actual_api_key_here"
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running!"
    exit 1
fi

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down --remove-orphans

# Build and start services
echo "🔨 Building and starting services..."
docker-compose up -d --build

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check service health
echo "🏥 Checking service health..."

# Check backend health
if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend health check failed"
    docker-compose logs backend
    exit 1
fi

# Check frontend
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend is responding"
else
    echo "❌ Frontend health check failed"
    docker-compose logs frontend
    exit 1
fi

# Check nginx
if curl -f http://localhost:80 > /dev/null 2>&1; then
    echo "✅ Nginx is responding"
else
    echo "❌ Nginx health check failed"
    docker-compose logs nginx
    exit 1
fi

echo "🎉 Deployment completed successfully!"
echo ""
echo "📋 Service URLs:"
echo "   Frontend: https://fiyatiq.wxcodesign.com"
echo "   Backend API: https://fiyatiq.wxcodesign.com/api"
echo "   API Docs: https://fiyatiq.wxcodesign.com/docs"
echo "   Health Check: https://fiyatiq.wxcodesign.com/health"
echo ""
echo "🔧 Useful commands:"
echo "   View logs: docker-compose logs -f"
echo "   Stop services: docker-compose down"
echo "   Restart services: docker-compose restart"
echo "   Update services: docker-compose pull && docker-compose up -d" 