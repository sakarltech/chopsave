#!/bin/bash
# ChopSave Local Development Setup Script
# Run this after starting Docker Desktop

set -e

echo "🍛 ChopSave Local Setup"
echo "======================="
echo ""

# Check Docker
if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker is not running. Please start Docker Desktop first."
  echo "   Open Docker Desktop from Applications, wait for it to start, then re-run this script."
  exit 1
fi

echo "✅ Docker is running"

# Start services
echo ""
echo "📦 Starting PostgreSQL + Redis..."
docker compose up -d
echo "✅ Database and Redis started"

# Wait for PostgreSQL to be ready
echo ""
echo "⏳ Waiting for PostgreSQL to be ready..."
until docker exec chopsave-postgres pg_isready -U postgres > /dev/null 2>&1; do
  sleep 1
done
echo "✅ PostgreSQL is ready"

# Wait for Redis
echo ""
echo "⏳ Waiting for Redis to be ready..."
until docker exec chopsave-redis redis-cli ping > /dev/null 2>&1; do
  sleep 1
done
echo "✅ Redis is ready"

# Run migrations
echo ""
echo "🗄️  Running database migrations..."
cd apps/api
npx tsx src/db/migrate.ts
cd ../..
echo "✅ Migrations complete"

echo ""
echo "🎉 Setup complete! Start the apps with:"
echo ""
echo "   API:    pnpm dev --filter @chopsave/api"
echo "   Web:    pnpm dev --filter @chopsave/web"
echo "   Mobile: cd apps/mobile && npx expo start"
echo ""
echo "   API will be at:  http://localhost:3001"
echo "   Web will be at:  http://localhost:3000"
echo ""
echo "   Test API:  curl http://localhost:3001/health"
echo ""
echo "📝 Don't forget to update apps/api/.env with real keys for:"
echo "   - PAYSTACK_SECRET_KEY (from paystack.com → Settings → API Keys)"
echo "   - TERMII_API_KEY (from termii.com → Dashboard → API Keys)"
echo "   - GOOGLE_CLIENT_ID (from console.cloud.google.com)"
