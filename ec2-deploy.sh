#!/bin/bash

#############################################################################
# 🚀 FOOD DELIVERY APP - AUTOMATED EC2 DEPLOYMENT SCRIPT
# Run this in your EC2 instance terminal to deploy everything
#############################################################################

set -e  # Exit on any error

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Functions
print_step() {
    echo -e "${BLUE}===================================================${NC}"
    echo -e "${GREEN}✓ $1${NC}"
    echo -e "${BLUE}===================================================${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ ERROR: $1${NC}"
    exit 1
}

# Start deployment
clear
echo ""
echo "╔═════════════════════════════════════════════════════════════════╗"
echo "║   🚀 FOOD DELIVERY APP - AWS EC2 DEPLOYMENT                    ║"
echo "║   Full Stack: Frontend + Backend with Docker Compose           ║"
echo "╚═════════════════════════════════════════════════════════════════╝"
echo ""

# Step 1: Install Docker
print_step "STEP 1: INSTALLING DOCKER & DOCKER COMPOSE"

print_info "Updating system packages..."
sudo apt-get update -y > /dev/null 2>&1
sudo apt-get upgrade -y > /dev/null 2>&1

print_info "Installing Docker..."
sudo apt-get install -y docker.io > /dev/null 2>&1

print_info "Installing Docker Compose..."
sudo apt-get install -y docker-compose-plugin > /dev/null 2>&1

print_info "Verifying installation..."
docker --version
docker compose version

# Step 2: Configure Docker permissions
print_step "STEP 2: CONFIGURING DOCKER PERMISSIONS"

print_info "Adding ubuntu user to docker group..."
sudo usermod -aG docker ubuntu

print_info "✓ Docker permissions configured"
print_warning "Note: You may need to run 'newgrp docker' or restart your terminal session"

# Step 3: Get GitHub repository
print_step "STEP 3: CLONING YOUR REPOSITORY"

print_info "Enter your GitHub repository URL"
echo "   Example: https://github.com/username/food-delivery-app.git"
read -p "   Repository URL: " REPO_URL

if [ -z "$REPO_URL" ]; then
    print_error "Repository URL is required"
fi

print_info "Cloning repository..."
if [ -d "food-delivery-app" ]; then
    print_info "Directory already exists, pulling latest changes..."
    cd food-delivery-app
    git pull
else
    git clone "$REPO_URL" food-delivery-app
    cd food-delivery-app
fi

print_info "Repository cloned successfully"
pwd

# Step 4: Configure environment variables
print_step "STEP 4: CONFIGURING ENVIRONMENT VARIABLES"

if [ ! -f "./backend/.env" ]; then
    print_warning "backend/.env not found, creating template..."
    cat > ./backend/.env << 'EOF'
# Backend Configuration
PORT=5000
NODE_ENV=production

# Firebase Admin SDK
# FIREBASE_KEY_PATH=/path/to/firebase-adminsdk.json

# MongoDB / Database
# MONGODB_URI=your_database_uri
# DB_NAME=food_delivery

# JWT Secret
# JWT_SECRET=your_secret_key

# Stripe Configuration
# STRIPE_SECRET_KEY=your_stripe_key

# Add other environment variables as needed
EOF
    print_warning "Created backend/.env template - Update with your credentials before deploying!"
fi

print_info "Current backend/.env:"
echo "---"
cat ./backend/.env
echo "---"
echo ""

read -p "Press Enter to continue with deployment, or Ctrl+C to edit .env first: "

# Step 5: Build and deploy
print_step "STEP 5: BUILDING DOCKER IMAGES"

print_info "Building frontend and backend images..."
print_info "This may take 2-5 minutes (first time only)..."
echo ""

docker compose -f docker-compose.prod.yml build

# Step 6: Start services
print_step "STEP 6: STARTING SERVICES"

print_info "Starting containers..."
docker compose -f docker-compose.prod.yml up -d

print_info "Waiting for services to initialize (10 seconds)..."
sleep 10

# Step 7: Verify deployment
print_step "STEP 7: VERIFYING DEPLOYMENT"

print_info "Checking container status..."
echo ""
docker ps

echo ""
print_info "Checking logs..."
echo ""
docker compose -f docker-compose.prod.yml logs --tail=20

# Final summary
echo ""
echo "╔═════════════════════════════════════════════════════════════════╗"
echo "║   ✅ DEPLOYMENT COMPLETE!                                       ║"
echo "╚═════════════════════════════════════════════════════════════════╝"
echo ""

# Get instance public IP
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)

echo "📋 APPLICATION DETAILS:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 Frontend URL:     http://$PUBLIC_IP"
echo "🔌 Backend API:      http://$PUBLIC_IP:5000"
echo "📊 API Health Check: http://$PUBLIC_IP:5000/api/health"
echo ""
echo "📝 USEFUL COMMANDS:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "   View logs (real-time):"
echo "   docker compose -f docker-compose.prod.yml logs -f"
echo ""
echo "   View specific service logs:"
echo "   docker logs food-delivery-frontend-prod -f"
echo "   docker logs food-delivery-backend-prod -f"
echo ""
echo "   Stop services:"
echo "   docker compose -f docker-compose.prod.yml down"
echo ""
echo "   Restart services:"
echo "   docker compose -f docker-compose.prod.yml restart"
echo ""
echo "   Rebuild after code changes:"
echo "   git pull"
echo "   docker compose -f docker-compose.prod.yml up -d --build"
echo ""
echo "   Check resource usage:"
echo "   docker stats"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚠️  NEXT STEPS:"
echo ""
echo "   1. Open browser and visit: http://$PUBLIC_IP"
echo "   2. Test backend API: http://$PUBLIC_IP:5000/api/health"
echo "   3. If pages are blank, check logs and verify .env variables"
echo "   4. Monitor: docker compose -f docker-compose.prod.yml logs -f"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 Tips:"
echo "   • Keep this terminal session open to monitor logs"
echo "   • Press Ctrl+C to stop following logs (services keep running)"
echo "   • Use 'docker compose -f docker-compose.prod.yml logs' for full history"
echo ""
echo "✅ Deployment script finished!"
echo ""
