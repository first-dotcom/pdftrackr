#!/bin/bash
set -e

echo "🚀 PDFTrackr Simple Launch Script"
echo "================================="

# Create simple environment files
echo "📝 Setting up environment..."

# Backend environment - simplified (no storage required for basic functionality)
cat > .env << 'EOF'
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://postgres:PDFTrackr2024!@postgres:5432/pdftrackr
REDIS_URL=redis://redis:6379
# JWT_SECRET removed - using Clerk authentication only
CLERK_SECRET_KEY=sk_test_Bi38YY9Da812z4VDDfNhScIvUM3ZYl6dco9Lfw0iOW
FRONTEND_URL=http://159.203.175.104:3000

# DigitalOcean Spaces (optional - add when ready)
S3_ENDPOINT=
S3_BUCKET=
S3_ACCESS_KEY=
S3_SECRET_KEY=
EOF

# Frontend environment - simplified
cat > frontend/.env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://159.203.175.104:3001
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_ZnJlZS1zaGVlcGRvZy0yNi5jbGVyay5hY2NvdW50cy5kZXYk
EOF

echo "🛑 Stopping existing containers..."
docker-compose down || true

echo "🏗️  Building containers..."
docker-compose build --no-cache

echo "🚀 Starting services..."
docker-compose up -d

echo "⏳ Waiting for services to start..."
sleep 10

echo "📊 Service Status:"
docker-compose ps

echo ""
echo "✅ PDFTrackr is now running!"
echo ""
echo "🌐 Access your application:"
echo "   Frontend: http://159.203.175.104:3000"
echo "   Backend:  http://159.203.175.104:3001"
echo ""
echo "🔐 Authentication:"
echo "   Sign Up: http://159.203.175.104:3000/sign-up"
echo "   Sign In: http://159.203.175.104:3000/sign-in"
echo ""
echo "📝 To check logs:"
echo "   docker-compose logs frontend"
echo "   docker-compose logs backend"
echo ""
echo "📁 File Storage:"
echo "   Currently disabled (no DigitalOcean Spaces configured)"
echo "   File uploads will work locally for testing"
echo ""
echo "🛑 To stop:"
echo "   docker-compose down"
echo ""
echo "⚙️  To add DigitalOcean Spaces later:"
echo "   1. Create a Space in DigitalOcean"
echo "   2. Generate API keys"
echo "   3. Update .env with your Spaces credentials"