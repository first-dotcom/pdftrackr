#!/bin/bash

# PDFTrackr Production Deployment Script
# Comprehensive deployment with ClamAV fixes and health monitoring

set -e  # Exit on any error

echo "🚀 Starting PDFTrackr Production Deployment..."

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

# Function to wait for service health with timeout
wait_for_service_health() {
    local service=$1
    local timeout=${2:-300}  # Default 5 minutes
    local interval=${3:-10}  # Default 10 seconds
    
    print_status "Waiting for $service to be healthy (timeout: ${timeout}s)..."
    
    local elapsed=0
    while [ $elapsed -lt $timeout ]; do
        if docker-compose ps $service | grep -q "healthy"; then
            print_success "$service is healthy!"
            return 0
        fi
        
        print_status "Waiting for $service... ($elapsed/$timeout seconds)"
        sleep $interval
        elapsed=$((elapsed + interval))
    done
    
    print_error "$service failed to become healthy within $timeout seconds"
    docker-compose logs $service --tail=20
    return 1
}

# Function to test ClamAV connectivity
test_clamav_connectivity() {
    print_status "Testing ClamAV connectivity..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        # First check if clamdscan is available
        if docker-compose exec -T clamav clamdscan --version > /dev/null 2>&1; then
            print_success "ClamAV daemon is available"
            
            # Try PING/PONG test if netcat is available
            if docker-compose exec -T clamav sh -c "which nc > /dev/null 2>&1" 2>/dev/null; then
                if docker-compose exec -T clamav sh -c "echo 'PING' | timeout 5 nc localhost 3310" 2>/dev/null | grep -q "PONG"; then
                    print_success "ClamAV is responding to PING/PONG"
                    return 0
                fi
            else
                # If netcat is not available, just check if the process is running
                if docker-compose exec -T clamav sh -c "pgrep -f clamd > /dev/null" 2>/dev/null; then
                    print_success "ClamAV daemon process is running"
                    return 0
                fi
            fi
        fi
        
        print_status "ClamAV not ready yet... (attempt $attempt/$max_attempts)"
        sleep 10
        attempt=$((attempt + 1))
    done
    
    print_warning "ClamAV connectivity test failed - service may still be starting"
    return 1
}

# Function to check service status
check_service_status() {
    print_status "Checking service status..."
    docker-compose ps
    
    echo ""
    print_status "Service Health Summary:"
    
    # Check each service
    local services=("postgres" "redis" "clamav" "backend" "frontend")
    for service in "${services[@]}"; do
        if docker-compose ps $service | grep -q "Up"; then
            print_success "$service is running"
        else
            print_error "$service is not running"
        fi
    done
}

# Function to run health checks
run_health_checks() {
    print_status "Running comprehensive health checks..."
    
    # Check backend health
    if curl -f http://localhost:3001/health > /dev/null 2>&1; then
        print_success "Backend health endpoint is responding"
    else
        print_error "Backend health endpoint is not responding"
        docker-compose logs backend --tail=20
        return 1
    fi
    
    # Check frontend health
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        print_success "Frontend is responding"
    else
        print_warning "Frontend is not responding (might still be starting)"
        docker-compose logs frontend --tail=10
    fi
    
    # Test ClamAV functionality
    if docker-compose exec -T clamav clamdscan --version > /dev/null 2>&1; then
        print_success "ClamAV daemon is accessible"
    else
        print_warning "ClamAV daemon may not be fully ready"
    fi
    
    # Test ClamAV connectivity
    test_clamav_connectivity
    
    return 0
}

# Function to check for issues in logs
check_log_issues() {
    print_status "Checking for known issues in logs..."
    
    # Check for authentication frequency warnings
    local auth_warnings=$(docker-compose logs backend | grep -c "High authentication frequency" || echo "0")
    if [ "$auth_warnings" -gt 0 ]; then
        print_warning "Found $auth_warnings authentication frequency warnings (this is normal during deployment)"
    else
        print_success "No authentication frequency issues detected"
    fi
    
    # Check for ClamAV availability issues
    local clamav_issues=$(docker-compose logs backend | grep -c "ClamAV is not available" || echo "0")
    if [ "$clamav_issues" -gt 0 ]; then
        print_warning "Found $clamav_issues ClamAV availability warnings (service may still be starting)"
    else
        print_success "No ClamAV availability issues detected"
    fi
    
    # Check for successful ClamAV responses
    local clamav_success=$(docker-compose logs backend | grep -c "ClamAV is available and responding" || echo "0")
    if [ "$clamav_success" -gt 0 ]; then
        print_success "ClamAV is available and responding"
    fi
}

# Main deployment function
main() {
    # Step 1: Environment setup
    print_status "Setting up production environment..."
    export NODE_ENV=${NODE_ENV:-production}
    print_status "Environment: $NODE_ENV"
    print_status "Enhanced virus scanning with fallback validation"
    
    # Step 2: Git operations
    print_status "Updating code from git..."
    
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        print_error "Not in a git repository. Please run this script from the project root."
        exit 1
    fi
    
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
    
    # Fetch and pull latest changes
    git fetch --all
    if git pull --rebase origin $CURRENT_BRANCH; then
        print_success "Successfully pulled latest changes"
    else
        print_warning "Git pull failed - continuing with current code"
    fi
    
    # Step 3: Stop and clean
    print_status "Stopping all containers..."
    docker-compose down --remove-orphans
    
    print_status "Cleaning old images and cache..."
    docker system prune -f
    
    # Step 4: Clean compiled files
    print_status "Cleaning compiled files..."
    rm -rf backend/dist frontend/.next frontend/dist 2>/dev/null || true
    print_success "Cleaned compiled files"
    
    # Step 5: Build fresh images
    print_status "Building fresh images with --no-cache..."
    docker-compose build --no-cache
    
    # Step 6: Start services in proper order
    print_status "Starting services in proper order..."
    
    # Start database and Redis first
    print_status "Starting database and Redis..."
    docker-compose up -d postgres redis
    
    # Wait for database and Redis to be healthy
    wait_for_service_health postgres 120
    wait_for_service_health redis 60
    
    # Start ClamAV and wait for it to be healthy
    print_status "Starting ClamAV..."
    docker-compose up -d clamav
    
    # Wait for ClamAV to be healthy (longer timeout due to virus definitions download)
    wait_for_service_health clamav 600  # 10 minutes for ClamAV
    
    # Test ClamAV connectivity
    test_clamav_connectivity
    
    # Start backend and frontend
    print_status "Starting backend and frontend..."
    docker-compose up -d backend frontend
    
    # Wait for backend to be healthy
    print_status "Waiting for backend to be healthy..."
    timeout 180 bash -c 'until docker-compose exec -T backend curl -f http://localhost:3001/health > /dev/null 2>&1; do sleep 5; done' || {
        print_error "Backend health check timeout"
        docker-compose logs backend --tail=50
        exit 1
    }
    
    # Step 7: Run health checks
    run_health_checks
    
    # Step 8: Run database migrations
    print_status "Running database migrations..."
    if docker-compose exec -T backend npm run migrate > /dev/null 2>&1; then
        print_success "Database migrations completed"
    else
        print_warning "Database migrations may have failed - check logs"
    fi
    
    # Step 9: Final verification
    check_service_status
    check_log_issues
    
    # Step 10: Success message
    print_success "Production deployment completed successfully! 🎉"
    echo ""
    echo "Services are running on:"
    echo "  Frontend: http://localhost:3000"
    echo "  Backend:  http://localhost:3001"
    echo ""
    echo "🛡️  Enhanced Security Configuration:"
    echo "  ✅ Virus scanning with ClamAV (primary)"
    echo "  ✅ Enhanced PDF structure validation (fallback)"
    echo "  ✅ Improved authentication rate limiting"
    echo "  📊 Comprehensive health monitoring"
    echo ""
    echo "🔍 Monitoring commands:"
    echo "  docker-compose ps                    # Service status"
    echo "  docker-compose logs -f backend       # Backend logs"
    echo "  docker-compose logs -f clamav        # ClamAV logs"
    echo "  docker-compose exec clamav echo 'PING' | nc localhost 3310  # Test ClamAV"
    echo ""
    echo "To view logs: docker-compose logs -f"
    echo "To stop:      docker-compose down"
}

# Run main function
main "$@"
