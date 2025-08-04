#!/bin/bash
# =============================================================================
# PDFTrackr Production Deployment Script for DigitalOcean Droplet (2vCPU/2GB)
# =============================================================================
# Simplified deployment - uses dev mode with production env for resource efficiency
# =============================================================================

set -e

echo "🚀 PDFTrackr Production Deployment (Simplified)"
echo "Optimized for: 2vCPU/2GB DigitalOcean Droplet"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    echo "Copy env.production to .env and configure your settings:"
    echo "  cp env.production .env"
    echo "  nano .env"
    exit 1
fi

# Check if production variables are set
if grep -q "your_secure_password" .env || grep -q "your-domain.com" .env; then
    echo -e "${YELLOW}⚠️  Warning: Default values detected in .env${NC}"
    echo "Please update your .env file with your actual domain and credentials!"
    echo "Press Ctrl+C to cancel, or Enter to continue..."
    read
fi

echo "📋 Resource Allocation Summary (Optimized for 2GB):"
echo "  • PostgreSQL: 256MB RAM, 0.5 CPU"
echo "  • Redis: 64MB RAM, 0.25 CPU"  
echo "  • Backend: 512MB RAM, 1.0 CPU"
echo "  • Frontend: 384MB RAM, 0.75 CPU"
echo "  • Prometheus: 128MB RAM, 0.25 CPU"
echo "  • Grafana: 128MB RAM, 0.25 CPU"
echo "  • Total: ~1.47GB RAM, 3.0 vCPU (leaves 530MB for system)"
echo ""

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down 2>/dev/null || true

# Build images (skip build cache for fresh deployment)
echo "🔨 Building optimized images..."
docker-compose build --no-cache --parallel

# Start services
echo "🚀 Starting production services..."
docker-compose up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy (60 seconds)..."
sleep 60

# Check service health
echo ""
echo "🏥 Health Check Summary:"
echo "========================================"

services=("backend" "frontend" "postgres" "redis" "prometheus" "grafana")
healthy_count=0

for service in "${services[@]}"; do
    if docker-compose ps | grep -q "${service}.*healthy\|${service}.*Up"; then
        echo -e "  ✅ ${service}: ${GREEN}Running${NC}"
        ((healthy_count++))
    else
        echo -e "  ❌ ${service}: ${RED}Not Running${NC}"
    fi
done

echo ""
echo "🌐 Access Your Application:"
echo "========================================"
echo "  • 📱 Frontend: http://$(curl -s ifconfig.me 2>/dev/null || echo 'YOUR-SERVER-IP'):3000"
echo "  • 🔧 Backend API: http://$(curl -s ifconfig.me 2>/dev/null || echo 'YOUR-SERVER-IP'):3001"
echo "  • 📊 Grafana: http://$(curl -s ifconfig.me 2>/dev/null || echo 'YOUR-SERVER-IP'):3002"
echo "  • 📈 Prometheus: http://$(curl -s ifconfig.me 2>/dev/null || echo 'YOUR-SERVER-IP'):9090"
echo ""

if [ $healthy_count -eq ${#services[@]} ]; then
    echo -e "${GREEN}🎉 Deployment Successful!${NC} All services are running."
else
    echo -e "${YELLOW}⚠️  Partial deployment.${NC} $healthy_count/${#services[@]} services are healthy."
    echo "Check logs with: docker-compose logs [service-name]"
fi

echo ""
echo "📊 Current Resource Usage:"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" 2>/dev/null || echo "Docker stats not available"

echo ""
echo "🔧 Management Commands:"
echo "  • View logs: docker-compose logs -f [service-name]"
echo "  • Monitor resources: docker stats"
echo "  • Restart service: docker-compose restart [service-name]"
echo "  • Stop all: docker-compose down"
echo ""
echo "💡 Next Steps:"
echo "  1. Point your domain DNS to: $(curl -s ifconfig.me 2>/dev/null || echo 'YOUR-SERVER-IP')"
echo "  2. Set up SSL with Nginx/Caddy reverse proxy"
echo "  3. Configure your domain in .env and restart"
echo "  4. Set up database backups"