#!/bin/bash
set -e

echo "🚀 CLONING REPOSITORIES"
echo ""

# Create app directory
mkdir -p ~/food-delivery-app
cd ~/food-delivery-app

echo "📥 Cloning frontend..."
git clone https://github.com/mumerse24/dineflow-frontened.git frontend

echo "📥 Cloning backend..."
git clone https://github.com/mumerse24/DineFlow-Backened.git backend

echo ""
echo "✓ Repositories cloned successfully!"
echo ""
echo "📂 Directory structure:"
ls -la

echo ""
echo "🔧 Checking for docker-compose.prod.yml..."
if [ ! -f "docker-compose.prod.yml" ]; then
    echo "⚠️  docker-compose.prod.yml not found in root!"
    echo "Please ensure it exists in the root directory"
    exit 1
fi

echo ""
echo "⚙️  Current directory:"
pwd

echo ""
echo "📋 Ready to deploy!"
echo "Next step: docker compose -f docker-compose.prod.yml up -d --build"
