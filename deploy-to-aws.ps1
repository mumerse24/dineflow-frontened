# 🚀 AUTOMATED AWS EC2 DEPLOYMENT SCRIPT (PowerShell)
# Deploy Food Delivery App (Frontend + Backend) to AWS EC2 in ONE COMMAND

param(
    [string]$Region = "us-east-1",
    [string]$ProjectName = "food-delivery-app",
    [string]$InstanceName = "food-delivery-instance"
)

# Color codes for output
function Write-Step { param([string]$Message); Write-Host "===================================================" -ForegroundColor Blue; Write-Host "✓ $Message" -ForegroundColor Green; Write-Host "===================================================" -ForegroundColor Blue }
function Write-Info { param([string]$Message); Write-Host "ℹ $Message" -ForegroundColor Cyan }
function Write-Warning { param([string]$Message); Write-Host "⚠ WARNING: $Message" -ForegroundColor Yellow }
function Write-Error-Custom { param([string]$Message); Write-Host "✗ ERROR: $Message" -ForegroundColor Red; exit 1 }

# Check prerequisites
Write-Step "CHECKING PREREQUISITES"

try {
    $awsVersion = aws --version
    Write-Info "AWS CLI found: $awsVersion"
} catch {
    Write-Error-Custom "AWS CLI is not installed. Download from: https://aws.amazon.com/cli/"
}

# Verify AWS credentials
Write-Step "VERIFYING AWS CREDENTIALS"

try {
    aws sts get-caller-identity --region $Region | Out-Null
    Write-Info "AWS credentials verified ✓"
} catch {
    Write-Error-Custom "AWS credentials not configured or invalid. Run: aws configure"
}

# Get user input for GitHub repo
Write-Host ""
$GitHubRepo = Read-Host "Enter your GitHub repository URL (e.g., https://github.com/username/food-delivery-app.git)"
if (-not $GitHubRepo) {
    Write-Error-Custom "GitHub repository URL is required"
}

# Create security group
Write-Step "CREATING SECURITY GROUP"

$SGName = "$ProjectName-sg"
$SGDescription = "Security group for $ProjectName (HTTP, HTTPS, SSH)"

$ExistingSG = aws ec2 describe-security-groups --filters "Name=group-name,Values=$SGName" --region $Region --query 'SecurityGroups[0].GroupId' --output text 2>$null

if ($ExistingSG -and $ExistingSG -ne "None") {
    Write-Info "Security group already exists: $ExistingSG"
    $SGID = $ExistingSG
} else {
    Write-Info "Creating new security group: $SGName"
    $SGID = aws ec2 create-security-group --group-name $SGName --description $SGDescription --region $Region --query 'GroupId' --output text
    Start-Sleep -Seconds 2
    
    # Add inbound rules
    Write-Info "Adding SSH rule (port 22)..."
    aws ec2 authorize-security-group-ingress --group-id $SGID --protocol tcp --port 22 --cidr 0.0.0.0/0 --region $Region 2>$null
    
    Write-Info "Adding HTTP rule (port 80)..."
    aws ec2 authorize-security-group-ingress --group-id $SGID --protocol tcp --port 80 --cidr 0.0.0.0/0 --region $Region 2>$null
    
    Write-Info "Adding HTTPS rule (port 443)..."
    aws ec2 authorize-security-group-ingress --group-id $SGID --protocol tcp --port 443 --cidr 0.0.0.0/0 --region $Region 2>$null
    
    Write-Info "Adding backend API rule (port 5000)..."
    aws ec2 authorize-security-group-ingress --group-id $SGID --protocol tcp --port 5000 --cidr 0.0.0.0/0 --region $Region 2>$null
}

Write-Info "Security Group ID: $SGID"

# Create or use existing key pair
Write-Step "SETTING UP SSH KEY PAIR"

$KeyName = "$ProjectName-key"
$KeyFile = "$PSScriptRoot\$KeyName.pem"

if (Test-Path $KeyFile) {
    Write-Info "Using existing key: $KeyFile"
} else {
    Write-Info "Creating new key pair: $KeyName"
    $KeyMaterial = aws ec2 create-key-pair --key-name $KeyName --region $Region --query 'KeyMaterial' --output text
    $KeyMaterial | Set-Content -Path $KeyFile -Encoding UTF8
    Write-Info "Key saved to: $KeyFile"
}

# Get latest Ubuntu 24.04 LTS AMI
Write-Step "FINDING UBUNTU 24.04 LTS AMI"

$AMI = aws ec2 describe-images --owners 099720109477 --filters "Name=name,Values=ubuntu/images/hvm-ssd/ubuntu-noble-24.04-amd64-server-*" "Name=state,Values=available" --region $Region --query 'sort_by(Images, &CreationDate)[-1].ImageId' --output text

if (-not $AMI -or $AMI -eq "None") {
    Write-Error-Custom "Could not find Ubuntu 24.04 LTS AMI in $Region"
}

Write-Info "Using AMI: $AMI"

# Launch EC2 instance
Write-Step "LAUNCHING EC2 INSTANCE"

Write-Info "Launching t3.micro instance: $InstanceName"

$InstanceId = aws ec2 run-instances --image-id $AMI --count 1 --instance-type t3.micro --key-name $KeyName --security-group-ids $SGID --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=$InstanceName}]" --region $Region --query 'Instances[0].InstanceId' --output text

Write-Info "Instance launched: $InstanceId"
Write-Info "Waiting for instance to start (this may take 1-2 minutes)..."

aws ec2 wait instance-running --instance-ids $InstanceId --region $Region

# Get public IP
$PublicIP = aws ec2 describe-instances --instance-ids $InstanceId --region $Region --query 'Reservations[0].Instances[0].PublicIpAddress' --output text

Write-Info "Instance is running!"
Write-Info "Public IP: $PublicIP"

# Display summary
Write-Step "🎉 EC2 INSTANCE CREATED SUCCESSFULLY!"

Write-Host ""
Write-Host "📋 INSTANCE DETAILS" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host ""
Write-Host "Instance ID:     $InstanceId"
Write-Host "Instance Name:   $InstanceName"
Write-Host "Public IP:       $PublicIP"
Write-Host "Region:          $Region"
Write-Host "Security Group:  $SGID"
Write-Host "Key Pair:        $KeyName"
Write-Host ""
Write-Host "📝 NEXT STEPS:" -ForegroundColor Green
Write-Host ""
Write-Host "1. SSH into the instance (wait 1-2 minutes for SSH to be ready):"
Write-Host "   ssh -i $KeyFile ubuntu@$PublicIP" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. On the EC2 instance, run these commands:"
Write-Host ""
Write-Host "   # Install Docker" -ForegroundColor Yellow
Write-Host "   sudo apt-get update && sudo apt-get install -y docker.io docker-compose-plugin" -ForegroundColor Cyan
Write-Host ""
Write-Host "   # Add ubuntu to docker group" -ForegroundColor Yellow
Write-Host "   sudo usermod -aG docker ubuntu && newgrp docker" -ForegroundColor Cyan
Write-Host ""
Write-Host "   # Clone your repository" -ForegroundColor Yellow
Write-Host "   git clone $GitHubRepo" -ForegroundColor Cyan
Write-Host "   cd food-delivery-app" -ForegroundColor Cyan
Write-Host ""
Write-Host "   # Update .env files with production values" -ForegroundColor Yellow
Write-Host "   nano ./backend/.env  # Edit with your credentials" -ForegroundColor Cyan
Write-Host ""
Write-Host "   # Deploy!" -ForegroundColor Yellow
Write-Host "   docker compose -f docker-compose.prod.yml up -d --build" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Access your application:"
Write-Host "   Frontend:    http://$PublicIP" -ForegroundColor Green
Write-Host "   Backend API: http://$PublicIP:5000" -ForegroundColor Green
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host ""
Write-Host "💡 Useful commands:" -ForegroundColor Cyan
Write-Host "   View logs:         docker compose -f docker-compose.prod.yml logs -f"
Write-Host "   Stop app:          docker compose -f docker-compose.prod.yml down"
Write-Host "   Restart app:       docker compose -f docker-compose.prod.yml restart"
Write-Host ""
Write-Host "💰 Cost Estimate:"
Write-Host "   t3.micro on-demand: ~\$0.01/hour (~\$7/month)"
Write-Host "   Free tier eligible: First 750 hours/month (12 months)"
Write-Host ""
Write-Host "⚠️  To stop/terminate the instance:" -ForegroundColor Yellow
Write-Host "   Stop:      aws ec2 stop-instances --instance-ids $InstanceId --region $Region"
Write-Host "   Terminate: aws ec2 terminate-instances --instance-ids $InstanceId --region $Region"
Write-Host ""
