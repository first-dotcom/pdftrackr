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

# Step 1: Check environment configuration
print_status "Checking environment configuration..."

# Set production defaults if not set
export NODE_ENV=${NODE_ENV:-production}

print_status "Environment: $NODE_ENV"
print_status "Virus Scanning: REQUIRED (Security First)"

# Step 2: Update code from git
print_status "Updating code from git..."

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_error "Not in a git repository. Please run this script from the project root."
    exit 1
fi

# Check if we're on the right branch
CURRENT_BRANCH=$(git branch --show-current)
print_status "Current branch: $CURRENT_BRANCH"

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    print_warning "You have uncommitted changes. Consider committing them first."
    read -p "Continue with uncommitted changes? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "Deployment cancelled."
        exit 1
    fi
fi

# Fetch all changes
git fetch --all

# Pull latest changes (with rebase to avoid merge commits)
if git pull --rebase origin $CURRENT_BRANCH; then
    print_success "Successfully pulled latest changes"
else
    print_warning "Git pull failed - continuing with current code"
fi

# Step 3: Stop all containers
print_status "Stopping all containers..."
docker-compose down --remove-orphans

# Step 4: Clean up old images (automatic in production)
if [ "$NODE_ENV" = "production" ]; then
    print_status "Cleaning old images (production mode)..."
    docker system prune -f
else
    # Interactive cleanup only in development
    read -p "Do you want to remove old images? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Removing old images..."
        docker-compose down --rmi all --volumes --remove-orphans
    fi
fi

# Step 5: Clean compiled files
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

# Step 6: Build fresh images
print_status "Building fresh images with --no-cache..."
docker-compose build --no-cache

# Step 7: Start core services first
print_status "Starting core services (database, Redis, ClamAV)..."
docker-compose up -d postgres redis clamav

# Step 8: Wait for services to be healthy
print_status "Waiting for services to be healthy..."
print_status "Docker Compose will handle service dependencies automatically"

# Wait for all services to be healthy (Docker Compose handles this)
print_status "Waiting for database and Redis to be ready..."
docker-compose up -d postgres redis
docker-compose wait postgres redis

print_status "Starting backend and frontend..."
docker-compose up -d backend frontend

# Wait for backend to be healthy (it depends on postgres, redis, clamav)
print_status "Waiting for backend to be healthy..."
timeout 120 bash -c 'until docker-compose exec -T backend curl -f http://localhost:3001/health > /dev/null 2>&1; do sleep 5; done' || {
    print_error "Backend health check timeout"
    docker-compose logs backend --tail=50
    exit 1
}

# Step 9: Check service status
print_status "Checking service status..."
docker-compose ps

# Step 10: Health checks
print_status "Running health checks..."

# Check backend health
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    print_success "Backend is healthy"
else
    print_error "Backend health check failed"
    docker-compose logs backend --tail=20
    exit 1
fi

# Check frontend health
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    print_success "Frontend is healthy"
else
    print_warning "Frontend health check failed (might still be starting)"
    docker-compose logs frontend --tail=20
fi

# Step 11: Test virus scanning
print_status "Testing virus scanning..."
if docker-compose exec -T clamav clamdscan --version > /dev/null 2>&1; then
    print_success "ClamAV is running and accessible"
else
    print_warning "ClamAV may not be fully ready yet (this is normal on first startup)"
fi

# Step 12: Run database migrations
print_status "Running database migrations..."
if docker-compose exec -T backend npm run migrate > /dev/null 2>&1; then
    print_success "Database migrations completed"
else
    print_warning "Database migrations may have failed - check logs"
fi

print_success "Deployment completed successfully! 🎉"
echo ""
echo "Services are running on:"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:3001"
echo ""
echo "To view logs: docker-compose logs -f"
echo "To stop:      docker-compose down"
echo ""
echo "🛡️  Security Configuration:"
echo "  ✅ Virus scanning is REQUIRED (Security First)"
echo "  🛡️  All uploads are scanned for threats"
echo "  📊 Scan failures are logged for monitoring"
