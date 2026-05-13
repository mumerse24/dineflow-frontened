#!/bin/bash

# Create backend .env file on EC2 with MongoDB connection

cat > ~/DineFlow-Backened/.env << 'EOF'
# Server Configuration
PORT=5000
NODE_ENV=production

# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://mumerse24:Umer1122@umer0.ckn9u8d.mongodb.net/food-delivery?appName=Umer0

# Database Name
DB_NAME=food-delivery

# JWT/Authentication
JWT_SECRET=your_jwt_secret_key_here_change_this

# Firebase Admin SDK (if using file path)
# FIREBASE_ADMIN_SDK_PATH=/path/to/firebase-adminsdk.json

# Firebase Credentials (if using env variables)
# FIREBASE_PROJECT_ID=your_project_id
# FIREBASE_PRIVATE_KEY=your_private_key
# FIREBASE_CLIENT_EMAIL=your_client_email

# Stripe (if using payments)
# STRIPE_SECRET_KEY=your_stripe_secret_key
# STRIPE_PUBLIC_KEY=your_stripe_public_key

# Session/Cookie
SESSION_SECRET=your_session_secret_key_here_change_this

# API Configuration
API_URL=http://localhost:5000
FRONTEND_URL=http://localhost

# Logging
LOG_LEVEL=info
EOF

echo "✓ Created .env file at ~/DineFlow-Backened/.env"
echo ""
echo "📋 Current .env content:"
cat ~/DineFlow-Backened/.env
