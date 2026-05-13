#!/bin/bash

#############################################################################
# 🚀 AUTOMATED AWS EC2 DEPLOYMENT SCRIPT
# Deploy Food Delivery App (Frontend + Backend) to AWS EC2 in ONE COMMAND
#############################################################################

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
    echo -e "${BLUE}===================================================${NC}"
    echo -e "${GREEN}✓ $1${NC}"
    echo -e "${BLUE}===================================================${NC}"
}

print_error() {
    echo -e "${RED}✗ ERROR: $1${NC}"
    exit 1
}

print_warning() {
    echo -e "${YELLOW}⚠ WARNING: $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check prerequisites
print_step "CHECKING PREREQUISITES"

if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed. Install it from: https://aws.amazon.com/cli/"
fi

if ! command -v jq &> /dev/null; then
    print_warning "jq is not installed. Installing..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install jq
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo apt-get install -y jq
    fi
fi

print_info "AWS CLI version: $(aws --version)"

# Get AWS region
read -p "Enter AWS Region (default: us-east-1): " AWS_REGION
AWS_REGION=${AWS_REGION:-us-east-1}

# Verify AWS credentials
print_step "VERIFYING AWS CREDENTIALS"
if ! aws sts get-caller-identity --region "$AWS_REGION" > /dev/null 2>&1; then
    print_error "AWS credentials not configured or invalid. Run: aws configure"
fi
print_info "AWS credentials verified ✓"

# Get project name
read -p "Enter project name (default: food-delivery-app): " PROJECT_NAME
PROJECT_NAME=${PROJECT_NAME:-food-delivery-app}

# Get instance name
read -p "Enter EC2 instance name (default: food-delivery-instance): " INSTANCE_NAME
INSTANCE_NAME=${INSTANCE_NAME:-food-delivery-instance}

# Create security group
print_step "CREATING SECURITY GROUP"

SG_NAME="${PROJECT_NAME}-sg"
SG_DESCRIPTION="Security group for $PROJECT_NAME (HTTP, HTTPS, SSH)"

# Check if security group already exists
SG_ID=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=$SG_NAME" --region "$AWS_REGION" --query 'SecurityGroups[0].GroupId' --output text 2>/dev/null || echo "")

if [ "$SG_ID" != "" ] && [ "$SG_ID" != "None" ]; then
    print_info "Security group already exists: $SG_ID"
else
    print_info "Creating new security group: $SG_NAME"
    SG_ID=$(aws ec2 create-security-group \
        --group-name "$SG_NAME" \
        --description "$SG_DESCRIPTION" \
        --region "$AWS_REGION" \
        --query 'GroupId' \
        --output text)
    
    sleep 2
    
    # Add inbound rules
    print_info "Adding SSH rule (port 22)..."
    aws ec2 authorize-security-group-ingress \
        --group-id "$SG_ID" \
        --protocol tcp \
        --port 22 \
        --cidr 0.0.0.0/0 \
        --region "$AWS_REGION" 2>/dev/null || true
    
    print_info "Adding HTTP rule (port 80)..."
    aws ec2 authorize-security-group-ingress \
        --group-id "$SG_ID" \
        --protocol tcp \
        --port 80 \
        --cidr 0.0.0.0/0 \
        --region "$AWS_REGION" 2>/dev/null || true
    
    print_info "Adding HTTPS rule (port 443)..."
    aws ec2 authorize-security-group-ingress \
        --group-id "$SG_ID" \
        --protocol tcp \
        --port 443 \
        --cidr 0.0.0.0/0 \
        --region "$AWS_REGION" 2>/dev/null || true
    
    print_info "Adding backend API rule (port 5000)..."
    aws ec2 authorize-security-group-ingress \
        --group-id "$SG_ID" \
        --protocol tcp \
        --port 5000 \
        --cidr 0.0.0.0/0 \
        --region "$AWS_REGION" 2>/dev/null || true
fi

print_info "Security Group ID: $SG_ID"

# Create or use existing key pair
print_step "SETTING UP SSH KEY PAIR"

KEY_NAME="${PROJECT_NAME}-key"
KEY_FILE="$KEY_NAME.pem"

if [ -f "$KEY_FILE" ]; then
    print_info "Using existing key: $KEY_FILE"
else
    print_info "Creating new key pair: $KEY_NAME"
    aws ec2 create-key-pair \
        --key-name "$KEY_NAME" \
        --region "$AWS_REGION" \
        --query 'KeyMaterial' \
        --output text > "$KEY_FILE"
    
    chmod 400 "$KEY_FILE"
    print_info "Key saved to: $KEY_FILE"
fi

# Get latest Ubuntu 24.04 LTS AMI
print_step "FINDING UBUNTU 24.04 LTS AMI"

AMI_ID=$(aws ec2 describe-images \
    --owners 099720109477 \
    --filters "Name=name,Values=ubuntu/images/hvm-ssd/ubuntu-noble-24.04-amd64-server-*" \
            "Name=state,Values=available" \
    --region "$AWS_REGION" \
    --query 'sort_by(Images, &CreationDate)[-1].ImageId' \
    --output text)

if [ -z "$AMI_ID" ] || [ "$AMI_ID" = "None" ]; then
    print_error "Could not find Ubuntu 24.04 LTS AMI in $AWS_REGION"
fi

print_info "Using AMI: $AMI_ID"

# Launch EC2 instance
print_step "LAUNCHING EC2 INSTANCE"

print_info "Launching t3.micro instance: $INSTANCE_NAME"

INSTANCE_ID=$(aws ec2 run-instances \
    --image-id "$AMI_ID" \
    --count 1 \
    --instance-type t3.micro \
    --key-name "$KEY_NAME" \
    --security-group-ids "$SG_ID" \
    --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=$INSTANCE_NAME}]" \
    --region "$AWS_REGION" \
    --query 'Instances[0].InstanceId' \
    --output text)

print_info "Instance launched: $INSTANCE_ID"
print_info "Waiting for instance to start (this may take 1-2 minutes)..."

aws ec2 wait instance-running \
    --instance-ids "$INSTANCE_ID" \
    --region "$AWS_REGION"

# Get public IP
PUBLIC_IP=$(aws ec2 describe-instances \
    --instance-ids "$INSTANCE_ID" \
    --region "$AWS_REGION" \
    --query 'Reservations[0].Instances[0].PublicIpAddress' \
    --output text)

print_info "Instance is running!"
print_info "Public IP: $PUBLIC_IP"

# Wait for SSH to be available
print_step "WAITING FOR SSH ACCESS"
print_info "Waiting for instance to be SSH-ready (1-2 minutes)..."

for i in {1..60}; do
    if ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=5 -i "$KEY_FILE" "ubuntu@$PUBLIC_IP" "echo 'SSH ready'" 2>/dev/null; then
        print_info "SSH is ready!"
        break
    fi
    if [ $i -eq 60 ]; then
        print_error "SSH not ready after 5 minutes. Try again later."
    fi
    echo -n "."
    sleep 5
done

# Create deployment script on remote server
print_step "UPLOADING DEPLOYMENT SCRIPT"

DEPLOY_SCRIPT=$(cat <<'EOF'
#!/bin/bash
set -e

echo "====== Installing Docker & Docker Compose ======"
sudo apt-get update -y
sudo apt-get install -y docker.io docker-compose-plugin

echo "====== Adding ubuntu to docker group ======"
sudo usermod -aG docker ubuntu
newgrp docker

echo "====== Cloning repository ======"
if [ -d "/home/ubuntu/food-delivery-app" ]; then
    cd /home/ubuntu/food-delivery-app
    git pull
else
    cd /home/ubuntu
    git clone https://github.com/YOUR_GITHUB_USERNAME/food-delivery-app.git
    cd food-delivery-app
fi

echo "====== Creating .env files ======"
if [ ! -f "./backend/.env" ]; then
    echo "⚠️  backend/.env not found. Creating template..."
    cat > ./backend/.env << 'ENDENV'
# Backend Configuration
PORT=5000
NODE_ENV=production

# Add your backend environment variables here
# Firebase Admin SDK path or credentials
# Database credentials
# API keys
ENDENV
fi

echo "====== Building and starting services ======"
docker compose -f docker-compose.prod.yml up -d --build

echo "====== Checking container status ======"
sleep 5
docker ps

echo ""
echo "=========================================="
echo "✓ Deployment Complete!"
echo "=========================================="
echo ""
echo "Frontend URL: http://$PUBLIC_IP"
echo "Backend API: http://$PUBLIC_IP:5000"
echo ""
echo "View logs:"
echo "  docker compose -f docker-compose.prod.yml logs -f"
echo ""
echo "Stop services:"
echo "  docker compose -f docker-compose.prod.yml down"
echo ""
EOF
)

echo "$DEPLOY_SCRIPT" > /tmp/deploy.sh
chmod +x /tmp/deploy.sh

scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i "$KEY_FILE" /tmp/deploy.sh "ubuntu@$PUBLIC_IP:/tmp/deploy.sh"

# Run deployment script
print_step "DEPLOYING APPLICATION"

ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i "$KEY_FILE" "ubuntu@$PUBLIC_IP" "bash /tmp/deploy.sh"

# Create systemd service for auto-restart
print_step "SETTING UP AUTO-RESTART SERVICE"

SYSTEMD_SERVICE=$(cat <<'EOF'
[Unit]
Description=Food Delivery App
After=docker.service
Requires=docker.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/food-delivery-app
ExecStart=/usr/bin/docker compose -f docker-compose.prod.yml up
ExecStop=/usr/bin/docker compose -f docker-compose.prod.yml down
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
)

echo "$SYSTEMD_SERVICE" > /tmp/food-delivery.service

scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i "$KEY_FILE" /tmp/food-delivery.service "ubuntu@$PUBLIC_IP:/tmp/food-delivery.service"

ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i "$KEY_FILE" "ubuntu@$PUBLIC_IP" << 'ENDCMD'
sudo mv /tmp/food-delivery.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable food-delivery.service
echo "✓ Systemd service configured (auto-restart on reboot)"
ENDCMD

# Display summary
print_step "🎉 DEPLOYMENT COMPLETE!"

echo ""
echo "📋 DEPLOYMENT SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Instance Details:"
echo "  Instance ID:     $INSTANCE_ID"
echo "  Instance Name:   $INSTANCE_NAME"
echo "  Public IP:       $PUBLIC_IP"
echo "  Region:          $AWS_REGION"
echo "  Security Group:  $SG_ID"
echo "  Key Pair:        $KEY_NAME ($KEY_FILE)"
echo ""
echo "Access Your Application:"
echo "  Frontend:        http://$PUBLIC_IP"
echo "  Backend API:     http://$PUBLIC_IP:5000"
echo ""
echo "SSH Access:"
echo "  ssh -i $KEY_FILE ubuntu@$PUBLIC_IP"
echo ""
echo "View Logs:"
echo "  ssh -i $KEY_FILE ubuntu@$PUBLIC_IP"
echo "  docker compose -f /home/ubuntu/food-delivery-app/docker-compose.prod.yml logs -f"
echo ""
echo "Stop Application:"
echo "  ssh -i $KEY_FILE ubuntu@$PUBLIC_IP"
echo "  docker compose -f /home/ubuntu/food-delivery-app/docker-compose.prod.yml down"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 NEXT STEPS:"
echo ""
echo "1. Update backend/.env on your local machine with production values:"
echo "   - Database credentials"
echo "   - API keys"
echo "   - Firebase Admin SDK path/credentials"
echo ""
echo "2. Push your project to GitHub with these changes"
echo ""
echo "3. SSH into the instance and update:"
echo "   ssh -i $KEY_FILE ubuntu@$PUBLIC_IP"
echo "   cd food-delivery-app && git pull"
echo "   docker compose -f docker-compose.prod.yml up -d --build"
echo ""
echo "4. (Optional) Set up a custom domain:"
echo "   - Point your domain's A record to: $PUBLIC_IP"
echo "   - Access via: http://yourdomain.com"
echo ""
echo "5. (Optional) Set up HTTPS with Let's Encrypt:"
echo "   ssh -i $KEY_FILE ubuntu@$PUBLIC_IP"
echo "   sudo apt-get install -y certbot"
echo "   sudo certbot certonly --standalone -d yourdomain.com"
echo ""
echo "💡 IMPORTANT: The instance is running and costs will accrue!"
echo "   Minimum cost: ~\$0.01/hour (\$7-8/month) for t3.micro on-demand."
echo "   To stop: aws ec2 stop-instances --instance-ids $INSTANCE_ID --region $AWS_REGION"
echo "   To terminate: aws ec2 terminate-instances --instance-ids $INSTANCE_ID --region $AWS_REGION"
echo ""
