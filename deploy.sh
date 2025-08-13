#!/bin/bash

# PDFTrackr Deployment Script
# This script ensures clean builds by clearing all cached files before deployment

set -e  # Exit on any error

echo "🚀 Starting PDFTrackr deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Step 1: Stop all containers
print_status "Stopping all containers..."
docker-compose down --remove-orphans

# Step 2: Clean up old images (optional)
read -p "Do you want to remove old images? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Removing old images..."
    docker-compose down --rmi all --volumes --remove-orphans
fi

# Step 3: Clean compiled files
print_status "Cleaning compiled files..."
if [ -d "backend/dist" ]; then
    rm -rf backend/dist
    print_success "Cleaned backend/dist"
fi

if [ -d "frontend/.next" ]; then
    rm -rf frontend/.next
    print_success "Cleaned frontend/.next"
fi

if [ -d "frontend/dist" ]; then
    rm -rf frontend/dist
    print_success "Cleaned frontend/dist"
fi

# Step 4: Clean Docker cache
print_status "Cleaning Docker cache..."
docker system prune -f

# Step 5: Build fresh images
print_status "Building fresh images with --no-cache..."
docker-compose build --no-cache

# Step 6: Start services
print_status "Starting services..."
docker-compose up -d

# Step 7: Wait for services to be healthy
print_status "Waiting for services to be healthy..."
sleep 10

# Step 8: Check service status
print_status "Checking service status..."
docker-compose ps

# Step 9: Health checks
print_status "Running health checks..."

# Check backend health
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    print_success "Backend is healthy"
else
    print_error "Backend health check failed"
fi

# Check frontend health
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    print_success "Frontend is healthy"
else
    print_warning "Frontend health check failed (might still be starting)"
fi

print_success "Deployment completed successfully! 🎉"
echo ""
echo "Services are running on:"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:3001"
echo ""
echo "To view logs: docker-compose logs -f"
echo "To stop:      docker-compose down"
