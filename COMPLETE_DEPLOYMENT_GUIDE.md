# 🚀 COMPLETE DEPLOYMENT GUIDE: Frontend + Backend + MongoDB on AWS EC2

## 📋 TABLE OF CONTENTS
1. Prerequisites Check
2. Connect to EC2 Instance
3. Install Docker
4. Clone Frontend Repository
5. Clone Backend Repository
6. Configure Backend Environment Variables
7. Create Docker Compose Configuration
8. Build and Deploy
9. Verify Everything is Running
10. Monitor and Troubleshoot

---

## ✅ STEP 1: PREREQUISITES CHECK

Before starting, make sure you have:
- ✅ AWS EC2 instance running (51.21.191.53)
- ✅ SSH access or EC2 Instance Connect
- ✅ GitHub repositories cloned links:
  - Frontend: https://github.com/mumerse24/dineflow-frontened.git
  - Backend: https://github.com/mumerse24/DineFlow-Backened.git
- ✅ MongoDB Atlas connection string:
  - `mongodb+srv://mumerse24:Umer1122@umer0.ckn9u8d.mongodb.net/food-delivery?appName=Umer0`

---

## 🔌 STEP 2: CONNECT TO EC2 INSTANCE

### Option A: Using EC2 Instance Connect (Browser - No SSH Key Needed)
1. Go to AWS Console → EC2 → Instances
2. Select your instance: `i-0d344412b4cb4590b`
3. Click **"Connect"** button
4. Select **"EC2 Instance Connect"** tab
5. Click **"Connect"** button again
6. A terminal opens in your browser

### Option B: Using SSH (Command Line)
```bash
ssh -i your-key.pem ubuntu@51.21.191.53
```

**Result:** You should see:
```
ubuntu@ip-172-31-35-207:~$
```

---

## 🐳 STEP 3: INSTALL DOCKER & DOCKER COMPOSE

### 3.1 Update System Packages
```bash
sudo apt-get update -y
sudo apt-get upgrade -y
```

**What it does:** Downloads latest package lists and upgrades installed packages.

**Expected output:**
```
Reading package lists... Done
Building dependency tree... Done
```

---

### 3.2 Install Docker
```bash
sudo apt-get install -y docker.io
```

**What it does:** Installs Docker Engine (container runtime).

**Verify installation:**
```bash
docker --version
```

**Expected output:**
```
Docker version 26.x.x, build xxxxx
```

---

### 3.3 Install Docker Compose
```bash
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

**What it does:** Downloads Docker Compose binary and makes it executable.

**Verify installation:**
```bash
docker compose version
```

**Expected output:**
```
Docker Compose version v2.x.x
```

---

### 3.4 Add Ubuntu User to Docker Group
```bash
sudo usermod -aG docker ubuntu
newgrp docker
```

**What it does:** Allows you to run Docker commands without `sudo`.

**Verify:**
```bash
docker ps
```

**Expected output:**
```
CONTAINER ID   IMAGE     COMMAND   CREATED   STATUS    PORTS     NAMES
(empty - no containers yet)
```

---

## 📥 STEP 4: CLONE FRONTEND REPOSITORY

### 4.1 Navigate to Home Directory
```bash
cd ~
pwd
```

**Expected output:**
```
/home/ubuntu
```

---

### 4.2 Clone Frontend Repository
```bash
git clone https://github.com/mumerse24/dineflow-frontened.git
```

**What it does:** Downloads frontend code from GitHub.

**Expected output:**
```
Cloning into 'dineflow-frontened'...
remote: Enumerating objects: 1500, done.
...
Receiving objects: 100% (1500/1500), 2.50 MiB | 5.00 MiB/s, done.
```

---

### 4.3 Check Frontend Structure
```bash
ls -la dineflow-frontened/
```

**Expected output:**
```
drwxr-xr-x  src
drwxr-xr-x  public
-rw-r--r--  package.json
-rw-r--r--  Dockerfile
-rw-r--r--  Dockerfile.prod
-rw-r--r--  tsconfig.json
...
```

---

## 📥 STEP 5: CLONE BACKEND REPOSITORY

### 5.1 Clone Backend Repository
```bash
git clone https://github.com/mumerse24/DineFlow-Backened.git
```

**What it does:** Downloads backend code from GitHub.

**Expected output:**
```
Cloning into 'DineFlow-Backened'...
remote: Enumerating objects: 2000, done.
...
```

---

### 5.2 Check Backend Structure
```bash
ls -la DineFlow-Backened/
```

**Expected output:**
```
drwxr-xr-x  routes
drwxr-xr-x  models
drwxr-xr-x  middleware
-rw-r--r--  server.js
-rw-r--r--  package.json
-rw-r--r--  Dockerfile
-rw-r--r--  Dockerfile.prod
...
```

---

## 🔧 STEP 6: CONFIGURE BACKEND ENVIRONMENT VARIABLES

### 6.1 Create .env File for Backend
```bash
cat > ~/DineFlow-Backened/.env << 'EOF'
# Server Configuration
PORT=5000
NODE_ENV=production

# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://mumerse24:Umer1122@umer0.ckn9u8d.mongodb.net/food-delivery?appName=Umer0

# Database Name
DB_NAME=food-delivery

# JWT/Authentication
JWT_SECRET=your_super_secret_jwt_key_change_me_in_production

# Firebase Admin SDK (if using)
# FIREBASE_ADMIN_SDK_PATH=/path/to/firebase-adminsdk.json

# Session/Cookie Secret
SESSION_SECRET=your_session_secret_key_change_me

# API Configuration
API_URL=http://localhost:5000
FRONTEND_URL=http://localhost

# Logging
LOG_LEVEL=info

# Add any other variables your backend needs
EOF
```

**What it does:** Creates `.env` file with all backend configuration.

---

### 6.2 Verify .env File
```bash
cat ~/DineFlow-Backened/.env
```

**Expected output:**
```
# Server Configuration
PORT=5000
NODE_ENV=production

# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://mumerse24:Umer1122@umer0.ckn9u8d.mongodb.net/food-delivery?appName=Umer0
...
```

---

### 6.3 Check MongoDB Connection

Test if MongoDB is accessible:
```bash
# Install MongoDB tools (optional, for testing)
sudo apt-get install -y mongodb-clients
```

Try connecting (if tools are installed):
```bash
mongosh "mongodb+srv://mumerse24:Umer1122@umer0.ckn9u8d.mongodb.net/food-delivery?appName=Umer0"
```

If it connects, you'll see:
```
Current Mongosh Log ID: xxxxx
Connected to MongoDB!
```

Press `Ctrl+C` to exit.

---

## 🏗️ STEP 7: CREATE DOCKER COMPOSE CONFIGURATION

### 7.1 Create docker-compose.prod.yml
```bash
cat > ~/docker-compose.prod.yml << 'EOF'
version: '3.8'

services:
  # Backend Service
  backend:
    build:
      context: ~/DineFlow-Backened
      dockerfile: Dockerfile.prod
    container_name: food-delivery-backend-prod
    ports:
      - "5000:5000"
    env_file:
      - ~/DineFlow-Backened/.env
    environment:
      - NODE_ENV=production
    restart: always
    networks:
      - food-delivery-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # Frontend Service
  frontend:
    build:
      context: ~/dineflow-frontened
      dockerfile: Dockerfile.prod
    container_name: food-delivery-frontend-prod
    ports:
      - "80:80"
    environment:
      - NODE_ENV=production
    depends_on:
      - backend
    restart: always
    networks:
      - food-delivery-network

networks:
  food-delivery-network:
    driver: bridge
EOF
```

**What it does:**
- Defines 2 services: backend and frontend
- Backend runs on port 5000
- Frontend runs on port 80 (HTTP)
- Frontend depends on backend (waits for it to start)
- Both share a network for communication
- Auto-restart if they crash

---

### 7.2 Verify docker-compose.prod.yml
```bash
cat ~/docker-compose.prod.yml
```

**Expected output:**
```
version: '3.8'

services:
  backend:
    build:
      context: ~/DineFlow-Backened
      dockerfile: Dockerfile.prod
    ...
```

---

## 🚀 STEP 8: BUILD AND DEPLOY

### 8.1 Navigate to Home Directory
```bash
cd ~
pwd
```

**Expected output:**
```
/home/ubuntu
```

---

### 8.2 Build Docker Images

This step reads both Dockerfiles and creates images:
```bash
docker compose -f docker-compose.prod.yml build
```

**What it does:**
- Reads `frontend/Dockerfile.prod` → builds frontend image
- Reads `backend/Dockerfile.prod` → builds backend image
- Downloads Node.js, npm packages, etc.

**Expected output:**
```
Building backend
#1 [internal] load build definition from Dockerfile.prod
#2 [internal] load .dockerignore
...
✓ built in 45s
```

**⏳ This may take 3-5 minutes (first time only)**

---

### 8.3 Start Services

Start both containers in background:
```bash
docker compose -f docker-compose.prod.yml up -d
```

**What it does:**
- `-d` = detached mode (runs in background)
- Starts backend container first
- Then starts frontend container

**Expected output:**
```
✓ Network food-delivery-network  Created
✓ Container food-delivery-backend-prod   Started
✓ Container food-delivery-frontend-prod  Started
```

---

### 8.4 Wait for Services to Initialize
```bash
sleep 10
```

Wait for containers to fully start and become healthy.

---

## ✅ STEP 9: VERIFY EVERYTHING IS RUNNING

### 9.1 Check Container Status
```bash
docker ps
```

**Expected output:**
```
CONTAINER ID   IMAGE                              STATUS              PORTS
a1b2c3d4e5f6   food-delivery-app-backend-prod     Up 5 seconds (health: starting)   0.0.0.0:5000->5000/tcp
f6e5d4c3b2a1   food-delivery-app-frontend-prod    Up 3 seconds                      0.0.0.0:80->80/tcp
```

✅ Both containers should show **"Up"**

---

### 9.2 Check Backend Logs
```bash
docker logs food-delivery-backend-prod
```

**Expected output:**
```
> node server.js

Server running on port 5000
Database connected: MongoDB Atlas
```

---

### 9.3 Check Frontend Logs
```bash
docker logs food-delivery-frontend-prod
```

**Expected output:**
```
nginx: configuration test is successful
nginx: master process started
```

---

### 9.4 Test Backend API

Check if backend is responding:
```bash
curl http://localhost:5000/api/health
```

**Expected output:**
```
{"status":"ok"}
```

Or from your local computer:
```bash
curl http://51.21.191.53:5000/api/health
```

---

### 9.5 Test Frontend

Open browser and visit:
```
http://51.21.191.53
```

You should see your website loaded!

---

### 9.6 View All Logs (Real-time)
```bash
docker compose -f docker-compose.prod.yml logs -f
```

**What it does:** Shows live logs from both containers.

Press `Ctrl+C` to stop following logs (services keep running).

---

## 📊 STEP 10: MONITOR AND TROUBLESHOOT

### 10.1 Check Container Resource Usage
```bash
docker stats
```

**Shows:**
- Memory usage
- CPU usage
- Network I/O

Press `Ctrl+C` to exit.

---

### 10.2 If Backend Container is Not Starting

Check logs:
```bash
docker logs food-delivery-backend-prod
```

Common issues:
- **MongoDB connection error**: Verify MONGODB_URI in .env
- **Port 5000 already in use**: Check `docker ps` for conflicts
- **Missing environment variables**: Edit .env and restart

Restart backend:
```bash
docker compose -f docker-compose.prod.yml restart backend
```

---

### 10.3 If Frontend Shows Blank Page

Check logs:
```bash
docker logs food-delivery-frontend-prod
```

Check if backend is accessible from frontend:
```bash
docker exec food-delivery-frontend-prod curl http://food-delivery-backend-prod:5000/api/health
```

---

### 10.4 If MongoDB Connection Fails

Verify connection string works locally:
```bash
echo "mongodb+srv://mumerse24:Umer1122@umer0.ckn9u8d.mongodb.net/food-delivery?appName=Umer0"
```

Check MongoDB Atlas:
1. Go to https://cloud.mongodb.com
2. Login
3. Check if cluster is running
4. Verify IP whitelist (add your EC2 IP or 0.0.0.0/0 for testing)

---

## 📝 QUICK REFERENCE COMMANDS

```bash
# View logs
docker compose -f docker-compose.prod.yml logs -f

# Stop all services
docker compose -f docker-compose.prod.yml down

# Restart services
docker compose -f docker-compose.prod.yml restart

# Rebuild after code changes
git pull  # in each repo folder
docker compose -f docker-compose.prod.yml up -d --build

# Check container status
docker ps

# View specific container logs
docker logs food-delivery-backend-prod -f
docker logs food-delivery-frontend-prod -f

# Execute command in container
docker exec food-delivery-backend-prod npm run seed

# Remove all containers and images
docker compose -f docker-compose.prod.yml down --rmi all
```

---

## 🎯 SUMMARY

Your application structure:

```
MongoDB Atlas (Cloud)
        ↓
Backend (Node.js on port 5000)
        ↓
Frontend (React/Nginx on port 80)
        ↓
User Browser
```

### URLs:
- **Frontend**: http://51.21.191.53
- **Backend API**: http://51.21.191.53:5000
- **API Health**: http://51.21.191.53:5000/api/health

### Architecture:
- **Frontend**: React app built with Vite, served by Nginx
- **Backend**: Node.js Express server
- **Database**: MongoDB Atlas (cloud-hosted)
- **Container Orchestration**: Docker Compose

### What's Running:
```
EC2 Instance
├── Docker Engine
│   ├── Container 1: Backend (Node.js)
│   └── Container 2: Frontend (Nginx)
└── Network: food-delivery-network
```

---

## ✅ SUCCESS INDICATORS

Everything is working correctly if:
1. ✅ `docker ps` shows 2 containers with "Up" status
2. ✅ `curl http://localhost:5000/api/health` returns `{"status":"ok"}`
3. ✅ Frontend loads when you visit http://51.21.191.53 in browser
4. ✅ Backend logs show "Database connected: MongoDB Atlas"
5. ✅ No error messages in `docker logs`

---

**You're ready to go! Follow the steps above in order. Let me know if you encounter any issues!** 🚀
