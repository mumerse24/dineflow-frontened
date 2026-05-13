# 🚀 QUICK START: Deploy to AWS EC2 (Full Stack)

## Prerequisites
- ✅ AWS Account (free tier eligible)
- ✅ AWS CLI installed (`aws --version` to check)
- ✅ AWS credentials configured (`aws configure`)
- ✅ GitHub repository with your code pushed
- ✅ SSH client (built-in on Mac/Linux, Git Bash on Windows)

---

## Option 1: One-Click Deployment (Recommended)

### On Mac/Linux:
```bash
cd /path/to/food-delivery-app
chmod +x deploy-to-aws.sh
./deploy-to-aws.sh
```

### On Windows (PowerShell):
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
.\deploy-to-aws.ps1
```

The script will:
1. Create a security group (HTTP, HTTPS, SSH access)
2. Create a key pair for SSH access
3. Launch t3.micro EC2 instance (free tier eligible)
4. Set up Docker and Docker Compose
5. Deploy your app

---

## Option 2: Manual Deployment (Step by Step)

### Step 1: Create Security Group
```bash
aws ec2 create-security-group \
  --group-name food-delivery-sg \
  --description "Allow HTTP, HTTPS, SSH" \
  --region us-east-1
```

### Step 2: Add Inbound Rules
```bash
# SSH (port 22)
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxxxxxx \
  --protocol tcp --port 22 --cidr 0.0.0.0/0 \
  --region us-east-1

# HTTP (port 80)
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxxxxxx \
  --protocol tcp --port 80 --cidr 0.0.0.0/0 \
  --region us-east-1

# HTTPS (port 443)
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxxxxxx \
  --protocol tcp --port 443 --cidr 0.0.0.0/0 \
  --region us-east-1
```

### Step 3: Create Key Pair
```bash
aws ec2 create-key-pair \
  --key-name food-delivery-key \
  --query 'KeyMaterial' --output text > food-delivery-key.pem \
  --region us-east-1

chmod 400 food-delivery-key.pem
```

### Step 4: Launch Instance
```bash
aws ec2 run-instances \
  --image-id ami-xxxxxxxxx \
  --count 1 \
  --instance-type t3.micro \
  --key-name food-delivery-key \
  --security-group-ids sg-xxxxxxxxx \
  --region us-east-1
```

### Step 5: Connect via SSH
```bash
ssh -i food-delivery-key.pem ubuntu@<PUBLIC_IP>
```

### Step 6: Install Docker
```bash
sudo apt-get update
sudo apt-get install -y docker.io docker-compose-plugin
sudo usermod -aG docker ubuntu
newgrp docker
```

### Step 7: Clone & Deploy
```bash
git clone https://github.com/YOUR_USERNAME/food-delivery-app.git
cd food-delivery-app
nano ./backend/.env  # Edit with production values
docker compose -f docker-compose.prod.yml up -d --build
```

---

## Access Your App

- **Frontend**: `http://<PUBLIC_IP>`
- **Backend API**: `http://<PUBLIC_IP>:5000`
- **SSH Access**: `ssh -i food-delivery-key.pem ubuntu@<PUBLIC_IP>`

---

## View Logs

```bash
# Follow logs in real-time
docker compose -f docker-compose.prod.yml logs -f

# View specific container logs
docker logs food-delivery-backend-prod -f
docker logs food-delivery-frontend-prod -f
```

---

## Stop/Restart Services

```bash
# Stop all services
docker compose -f docker-compose.prod.yml down

# Restart services
docker compose -f docker-compose.prod.yml restart

# Rebuild and restart (after code changes)
docker compose -f docker-compose.prod.yml up -d --build
```

---

## Update Application

After pushing changes to GitHub:

```bash
cd ~/food-delivery-app
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

---

## Cost Estimate

| Resource | Price | Note |
|----------|-------|------|
| t3.micro EC2 | $0.01/hr | Free for 12 months (750 hrs/month) |
| Data out | $0.09/GB | First 15GB/month free |
| EBS Storage (20GB) | Free | Included in free tier |
| **Total** | **~$7-8/month** | After free tier expires |

---

## Important: Cleanup

### Stop Instance (Keep it for later)
```bash
aws ec2 stop-instances \
  --instance-ids i-xxxxxxxxx \
  --region us-east-1
```

### Terminate Instance (Delete everything)
```bash
aws ec2 terminate-instances \
  --instance-ids i-xxxxxxxxx \
  --region us-east-1
```

---

## Set Up Custom Domain (Optional)

1. Update your domain's A record to point to the Elastic IP
2. Access via `http://yourdomain.com`

### Enable HTTPS (Let's Encrypt)
```bash
sudo apt-get install -y certbot
sudo certbot certonly --standalone -d yourdomain.com
# Update nginx.conf with SSL certificates
docker compose -f docker-compose.prod.yml up -d --build
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Can't connect to SSH | Wait 2-3 minutes for instance to fully boot, check security group SSH rule |
| Blank page on frontend | Check `docker logs food-delivery-frontend-prod`, verify `.env` variables |
| Backend not responding | Check `docker logs food-delivery-backend-prod`, verify port 5000 security rule |
| High memory/CPU | t3.micro has 1GB RAM; check `docker stats`, consider upgrading instance type |
| App crashes on reboot | Set up systemd service (see AWS_DEPLOYMENT_GUIDE.md) |

---

## Quick Command Reference

```bash
# SSH into instance
ssh -i food-delivery-key.pem ubuntu@<PUBLIC_IP>

# Check running containers
docker ps

# View all logs
docker compose -f docker-compose.prod.yml logs

# Execute command in backend container
docker exec food-delivery-backend-prod npm run seed

# View resource usage
docker stats

# Clean up unused Docker images/volumes
docker system prune

# Update docker-compose.yml and rebuild
docker compose -f docker-compose.prod.yml up -d --build
```

---

## Need Help?

- AWS CLI docs: https://docs.aws.amazon.com/cli/
- Docker docs: https://docs.docker.com
- Docker Compose: https://docs.docker.com/compose/
- Free tier details: https://aws.amazon.com/free/

Happy deploying! 🚀
