# EC2 + Docker Compose Deployment Guide

## Step 1: Create Security Group

1. Go to **AWS Console → EC2 → Security Groups**
2. Click **Create security group**
3. Name: `food-delivery-sg`
4. Description: "Allow HTTP, HTTPS, SSH for food delivery app"
5. Add these inbound rules:
   - **SSH**: Port 22, Source: 0.0.0.0/0 (restrict to your IP for security)
   - **HTTP**: Port 80, Source: 0.0.0.0/0
   - **HTTPS**: Port 443, Source: 0.0.0.0/0 (if using SSL)
6. Click **Create security group**

## Step 2: Launch EC2 Instance

1. Go to **AWS Console → EC2 → Instances → Launch Instances**
2. **Name**: `food-delivery-app`
3. **AMI**: Select "Ubuntu Server 24.04 LTS" (free tier eligible)
4. **Instance type**: `t3.micro` (free tier)
5. **Key pair**: 
   - Create new key pair (or use existing)
   - Name: `food-delivery-key`
   - Download `.pem` file (keep it safe!)
6. **Network settings**:
   - VPC: Default
   - Security group: Select `food-delivery-sg`
   - Auto-assign public IP: Enable
7. **Storage**: 20 GB (default is fine)
8. Click **Launch instance**

## Step 3: Connect to Instance

Once instance is running, get its **Public IPv4 address** from the instances list.

On your local machine:
```bash
# Make key readable
chmod 400 food-delivery-key.pem

# SSH into instance
ssh -i food-delivery-key.pem ubuntu@<PUBLIC_IP>
```

Replace `<PUBLIC_IP>` with your instance's public IPv4 address.

## Step 4: Install Docker on EC2

Run these commands on the EC2 instance:

```bash
# Update system packages
sudo apt update
sudo apt upgrade -y

# Install Docker
sudo apt install docker.io -y

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add ubuntu user to docker group (so you don't need sudo)
sudo usermod -aG docker ubuntu

# Verify installation
docker --version
docker compose --version

# Exit and reconnect to apply group changes
exit
# SSH back in
ssh -i food-delivery-key.pem ubuntu@<PUBLIC_IP>
```

## Step 5: Set Up Your App on EC2

Create a project directory and copy your files:

```bash
# Create app directory
mkdir -p ~/food-delivery-app
cd ~/food-delivery-app

# Create .env file with your credentials
cat > .env << 'EOF'
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id

# Stripe Configuration
VITE_STRIPE_PUBLIC_KEY=your_stripe_public_key

# API Configuration
VITE_API_URL=https://your-backend-api.com
VITE_SOCKET_URL=https://your-backend-socket.com

NODE_ENV=production
EOF
```

Then copy your project files from local machine:

```bash
# From your local machine
scp -i food-delivery-key.pem -r ./docker-compose.prod.yml ubuntu@<PUBLIC_IP>:~/food-delivery-app/
scp -i food-delivery-key.pem -r ./nginx.conf ubuntu@<PUBLIC_IP>:~/food-delivery-app/
scp -i food-delivery-key.pem -r ./Dockerfile.prod ubuntu@<PUBLIC_IP>:~/food-delivery-app/
scp -i food-delivery-key.pem -r ./package.json ubuntu@<PUBLIC_IP>:~/food-delivery-app/
scp -i food-delivery-key.pem -r ./package-lock.json ubuntu@<PUBLIC_IP>:~/food-delivery-app/
scp -i food-delivery-key.pem -r ./.dockerignore ubuntu@<PUBLIC_IP>:~/food-delivery-app/
scp -i food-delivery-key.pem -r ./src ubuntu@<PUBLIC_IP>:~/food-delivery-app/
scp -i food-delivery-key.pem -r ./public ubuntu@<PUBLIC_IP>:~/food-delivery-app/
```

Or clone your GitHub repo:
```bash
# On EC2 instance
cd ~/food-delivery-app
git clone https://github.com/YOUR_USERNAME/your-repo.git .
```

## Step 6: Build and Run

Back on EC2 instance:

```bash
cd ~/food-delivery-app

# Build the image
docker compose -f docker-compose.prod.yml build

# Start the container
docker compose -f docker-compose.prod.yml up -d

# Verify it's running
docker ps
docker logs food-delivery-app
```

## Step 7: Access Your App

Open browser and go to:
```
http://<PUBLIC_IP>
```

Replace `<PUBLIC_IP>` with your EC2 instance's public IPv4 address.

## Step 8: Set Up Domain (Optional)

If you have a domain:

1. Go to your domain registrar (GoDaddy, Namecheap, etc.)
2. Point the domain's **A record** to your EC2 instance's **Elastic IP**
3. Then access via `http://yourdomain.com`

### Set Up HTTPS with Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot certonly --standalone -d yourdomain.com

# Update nginx.conf to use SSL
# Copy certificates to container or update docker-compose
```

## Step 9: Keep App Running (Using systemd)

Create a systemd service so the app restarts on reboot:

```bash
sudo nano /etc/systemd/system/food-delivery.service
```

Paste:
```ini
[Unit]
Description=Food Delivery App
After=docker.service
Requires=docker.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/food-delivery-app
ExecStart=/usr/local/bin/docker-compose -f docker-compose.prod.yml up
ExecStop=/usr/local/bin/docker-compose -f docker-compose.prod.yml down
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable food-delivery.service
sudo systemctl start food-delivery.service
sudo systemctl status food-delivery.service
```

## Monitoring & Maintenance

```bash
# View logs
docker logs food-delivery-app
docker logs -f food-delivery-app  # Follow logs

# Check resource usage
docker stats

# Update app (if code changes)
git pull
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d

# Stop app
docker compose -f docker-compose.prod.yml down

# Restart app
docker compose -f docker-compose.prod.yml restart
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Connection refused" on port 80 | Check security group allows port 80, verify container is running with `docker ps` |
| Blank page | Check `docker logs food-delivery-app`, verify `.env` variables |
| High memory usage | t3.micro has 1GB RAM; check `docker stats`, reduce processes or upgrade instance |
| Certificate errors | Ensure Firebase/Stripe credentials are correct in `.env` |
| App not starting on reboot | Enable systemd service: `sudo systemctl enable food-delivery.service` |

## Cost Estimate (Free Tier)
- EC2 t3.micro: **Free** (1 year, 750 hrs/month)
- Data transfer: First **15GB/month free**, then $0.09/GB
- Storage: 20GB included in free tier
- **Total: $0/month** (if within free tier limits)

After free tier expires: ~$3-5/month for t3.micro instance.
