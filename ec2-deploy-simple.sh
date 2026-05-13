#!/bin/bash
set -e
echo "🚀 Installing Docker..."
sudo apt-get update -y && sudo apt-get install -y docker.io docker-compose-plugin
echo "✓ Adding docker permissions..."
sudo usermod -aG docker ubuntu
echo "ℹ Enter your GitHub repo URL (e.g., https://github.com/username/food-delivery-app.git)"
read REPO
echo "📥 Cloning repository..."
[ -d "food-delivery-app" ] && (cd food-delivery-app && git pull) || git clone "$REPO" food-delivery-app
cd food-delivery-app
echo "🔧 Checking backend/.env..."
[ ! -f "./backend/.env" ] && cp ./backend/.env.example ./backend/.env 2>/dev/null || echo "ℹ Please update backend/.env with your credentials"
echo "🏗️  Building and deploying (this takes 2-5 minutes)..."
docker compose -f docker-compose.prod.yml up -d --build
sleep 10
echo ""
echo "╔════════════════════════════════════════════════════╗"
echo "║  ✅ DEPLOYMENT COMPLETE!                          ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
echo "🌐 Frontend:  http://$PUBLIC_IP"
echo "🔌 Backend:   http://$PUBLIC_IP:5000"
echo ""
echo "📊 Container Status:"
docker ps
echo ""
echo "📋 View logs:    docker compose -f docker-compose.prod.yml logs -f"
echo "🛑 Stop app:     docker compose -f docker-compose.prod.yml down"
echo "🔄 Update code:  git pull && docker compose -f docker-compose.prod.yml up -d --build"
echo ""
