#!/bin/bash

# PDFTrackr Quick Deployment Script
# For automated deployments without prompts

set -e  # Exit on any error

echo "🚀 Quick deployment starting..."

# Stop containers
docker-compose down --remove-orphans

# Clean compiled files
rm -rf backend/dist frontend/.next frontend/dist 2>/dev/null || true

# Clean Docker cache
docker system prune -f

# Build and start
docker-compose build --no-cache
docker-compose up -d

echo "✅ Quick deployment completed!"