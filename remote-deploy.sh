#!/bin/bash
set -e

echo "=========================================="
echo "Leave Approval System - Deployment"
echo "=========================================="
echo ""

# Function to log
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log "Starting deployment..."

# Update system
log "Updating system packages..."
sudo apt update -qq 2>&1 || sudo yum update -y -q 2>&1 || true

# Install Docker if not installed
if ! command -v docker &> /dev/null; then
    log "Installing Docker..."
    if command -v apt &> /dev/null; then
        curl -fsSL https://get.docker.com -o get-docker.sh
        sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    sudo newgrp docker <<EOF || true
EOF
    rm -f get-docker.sh
    elif command -v yum &> /dev/null; then
        sudo yum install -y docker
        sudo systemctl start docker
        sudo systemctl enable docker
        sudo usermod -aG docker $USER
    fi
    log "Docker installed"
else
    log "Docker already installed"
fi

# Install Docker Compose if not installed
if ! command -v docker compose &> /dev/null && ! command -v docker-compose &> /dev/null; then
    log "Installing Docker Compose..."
    if command -v apt &> /dev/null; then
        sudo apt install -y docker-compose-plugin
    elif command -v yum &> /dev/null; then
        sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
        sudo ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
    fi
    log "Docker Compose installed"
else
    log "Docker Compose already installed"
fi

# Install Git if not installed
if ! command -v git &> /dev/null; then
    log "Installing Git..."
    if command -v apt &> /dev/null; then
        sudo apt install -y git
    elif command -v yum &> /dev/null; then
        sudo yum install -y git
    fi
    log "Git installed"
else
    log "Git already installed"
fi

# Configure firewall
log "Configuring firewall..."
if command -v ufw &> /dev/null; then
    sudo ufw allow 22/tcp 2>&1 || true
    sudo ufw allow 80/tcp 2>&1 || true
    sudo ufw allow 443/tcp 2>&1 || true
    sudo ufw allow 8080/tcp 2>&1 || true
    sudo ufw --force enable 2>&1 || true
elif command -v firewall-cmd &> /dev/null; then
    sudo firewall-cmd --permanent --add-service=ssh 2>&1 || true
    sudo firewall-cmd --permanent --add-service=http 2>&1 || true
    sudo firewall-cmd --permanent --add-service=https 2>&1 || true
    sudo firewall-cmd --permanent --add-port=8080/tcp 2>&1 || true
    sudo firewall-cmd --reload 2>&1 || true
fi
log "Firewall configured"

# Stop and remove existing containers first
log "Stopping and removing existing containers..."
PROJECT_DIR="$HOME/leave-approval"
if [ -d "$PROJECT_DIR" ]; then
    cd "$PROJECT_DIR" 2>/dev/null || true
    if [ -f "docker-compose.prod.yml" ] || [ -f "docker-compose.yml" ]; then
        sudo docker compose -f docker-compose.prod.yml down 2>&1 || sudo docker-compose -f docker-compose.prod.yml down 2>&1 || true
        sudo docker compose down 2>&1 || sudo docker-compose down 2>&1 || true
    fi
    cd ~
fi

# Remove existing project directory to free up space
log "Removing existing project directory to free up space..."
if [ -d "$PROJECT_DIR" ]; then
    sudo rm -rf "$PROJECT_DIR" 2>&1 || true
    log "Old project directory removed"
else
    log "No existing project directory found"
fi

# Create project directory
log "Setting up fresh project directory..."
mkdir -p "$PROJECT_DIR"
cd "$PROJECT_DIR"

# Clone repository fresh
log "Cloning repository..."
git clone https://github.com/anuj1012/EMS_Latrobe.git . || {
    log "ERROR: Failed to clone repository"
    exit 1
}
log "Repository cloned successfully"

# Generate secure passwords
log "Generating secure passwords..."
JWT_SECRET=$(openssl rand -base64 64 2>/dev/null || head -c 64 /dev/urandom | base64 || echo "default-jwt-secret-change-this-in-production-$(date +%s)")
DB_PASSWORD=$(openssl rand -base64 32 2>/dev/null || head -c 32 /dev/urandom | base64 || echo "default-db-password-$(date +%s)")
MINIO_SECRET=$(openssl rand -base64 32 2>/dev/null || head -c 32 /dev/urandom | base64 || echo "default-minio-secret-$(date +%s)")

# Create .env.prod file
log "Creating environment file..."
cat > .env.prod <<EOF
# Database Configuration
DATABASE_NAME=leave_approval_db
DATABASE_USERNAME=postgres
DATABASE_PASSWORD="$DB_PASSWORD"
POSTGRES_PORT=5432

# JWT Configuration
JWT_SECRET="$JWT_SECRET"
JWT_EXPIRATION=86400000

# CORS Configuration
CORS_ALLOWED_ORIGINS="http://54.79.167.220,https://54.79.167.220"

# MinIO Configuration
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY="$MINIO_SECRET"
MINIO_BUCKET_NAME=leave-approval-media
MINIO_PORT=9000
MINIO_CONSOLE_PORT=9001

# Application URLs
API_URL="http://54.79.167.220:8080/api"
BACKEND_PORT=8080
FRONTEND_PORT=80
EOF

log "Environment file created"

# Make deploy script executable
if [ -f "deploy.sh" ]; then
    chmod +x deploy.sh
fi

# Check disk space
log "Checking disk space..."
df -h / | tail -1

# Aggressive cleanup to free up space
log "Performing aggressive cleanup to free up disk space..."

# Clean apt cache
log "Cleaning apt cache..."
sudo apt-get clean 2>&1 || true
sudo apt-get autoclean 2>&1 || true
sudo apt-get autoremove -y 2>&1 || true

# Clean system logs (keep last 7 days)
log "Cleaning old system logs..."
sudo journalctl --vacuum-time=7d 2>&1 || true
sudo find /var/log -type f -name "*.log" -mtime +7 -delete 2>&1 || true
sudo find /var/log -type f -name "*.gz" -delete 2>&1 || true

# Clean temporary files
log "Cleaning temporary files..."
sudo rm -rf /tmp/* 2>&1 || true
sudo rm -rf /var/tmp/* 2>&1 || true

# Clean old kernels (keep current and one previous)
log "Cleaning old kernels..."
sudo apt-get purge -y $(dpkg -l linux-{image,headers}-* | awk '/^ii/{print $2}' | grep -E '[0-9]+\.[0-9]+\.[0-9]+' | grep -v $(uname -r | cut -d- -f1,2) | head -n -1) 2>&1 || true

# Clean up Docker to free space
log "Cleaning up Docker (removing ALL images, containers, volumes, build cache)..."
# Stop all containers
if [ "$(sudo docker ps -aq | wc -l)" -gt 0 ]; then
    sudo docker stop $(sudo docker ps -aq) 2>&1 || true
fi
# Remove all containers
if [ "$(sudo docker ps -aq | wc -l)" -gt 0 ]; then
    sudo docker rm $(sudo docker ps -aq) 2>&1 || true
fi
# Remove all images
if [ "$(sudo docker images -q | wc -l)" -gt 0 ]; then
    sudo docker rmi $(sudo docker images -q) 2>&1 || true
fi
# Remove all volumes
if [ "$(sudo docker volume ls -q | wc -l)" -gt 0 ]; then
    sudo docker volume rm $(sudo docker volume ls -q) 2>&1 || true
fi
# System prune
sudo docker system prune -af --volumes 2>&1 || true
sudo docker builder prune -af 2>&1 || true

# Clean Docker overlay2 (if still needed)
log "Cleaning Docker overlay2..."
sudo systemctl stop docker 2>&1 || true
sudo rm -rf /var/lib/docker/overlay2/* 2>&1 || true
sudo systemctl start docker 2>&1 || true

log "Disk space after cleanup:"
df -h / | tail -1

# Install Maven if not installed (to build JAR outside Docker)
if ! command -v mvn &> /dev/null; then
    log "Installing Maven to build JAR outside Docker..."
    if command -v apt &> /dev/null; then
        sudo apt install -y maven
    elif command -v yum &> /dev/null; then
        sudo yum install -y maven
    fi
    log "Maven installed"
else
    log "Maven already installed"
fi

# Install Node.js if not installed (to build frontend outside Docker)
if ! command -v node &> /dev/null; then
    log "Installing Node.js to build frontend outside Docker..."
    if command -v apt &> /dev/null; then
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt install -y nodejs
    elif command -v yum &> /dev/null; then
        curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
        sudo yum install -y nodejs
    fi
    log "Node.js installed"
else
    log "Node.js already installed"
fi

# Build backend JAR outside Docker to save space
log "Building backend JAR file..."
cd backend
if [ -f "pom.xml" ]; then
    mvn clean package -DskipTests -q || {
        log "ERROR: Failed to build backend JAR"
        exit 1
    }
    log "Backend JAR built successfully"
else
    log "ERROR: pom.xml not found in backend directory"
    exit 1
fi
cd ..

# Build frontend outside Docker to save space
log "Building frontend application..."
cd frontend
if [ -f "package.json" ]; then
    # Clean previous build
    rm -rf dist node_modules 2>&1 || true
    
    # Install dependencies and build
    npm ci --silent && npm run build --silent || {
        log "ERROR: Failed to build frontend"
        exit 1
    }
    log "Frontend built successfully"
else
    log "ERROR: package.json not found in frontend directory"
    exit 1
fi
cd ..

# Stop existing containers
log "Stopping existing containers..."
sudo docker compose -f docker-compose.prod.yml --env-file .env.prod down 2>&1 || sudo docker-compose -f docker-compose.prod.yml --env-file .env.prod down 2>&1 || true

# Deploy with Docker Compose
log "Building and starting containers..."
if command -v docker &> /dev/null && docker compose version &> /dev/null 2>&1; then
    sudo docker compose -f docker-compose.prod.yml --env-file .env.prod up --build -d
elif command -v docker-compose &> /dev/null; then
    sudo docker-compose -f docker-compose.prod.yml --env-file .env.prod up --build -d
else
    log "ERROR: Docker Compose not available"
    exit 1
fi

log "Waiting for services to start..."
sleep 45

# Check health
log "Checking service health..."
BACKEND_HEALTHY=false
FRONTEND_HEALTHY=false

for i in {1..10}; do
    if curl -f http://localhost:8080/api/health > /dev/null 2>&1; then
        BACKEND_HEALTHY=true
        log "✓ Backend is healthy"
        break
    fi
    sleep 5
done

if [ "$BACKEND_HEALTHY" = "false" ]; then
    log "⚠ Backend health check failed (checking logs...)"
    sudo docker compose -f docker-compose.prod.yml logs backend 2>&1 | tail -20 || sudo docker-compose -f docker-compose.prod.yml logs backend 2>&1 | tail -20 || true
fi

for i in {1..10}; do
    if curl -f http://localhost/health > /dev/null 2>&1; then
        FRONTEND_HEALTHY=true
        log "✓ Frontend is healthy"
        break
    fi
    sleep 5
done

if [ "$FRONTEND_HEALTHY" = "false" ]; then
    log "⚠ Frontend health check failed (checking logs...)"
    sudo docker compose -f docker-compose.prod.yml logs frontend 2>&1 | tail -20 || sudo docker-compose -f docker-compose.prod.yml logs frontend 2>&1 | tail -20 || true
fi

# Show container status
log "Container status:"
sudo docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" || sudo docker ps

echo ""
echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo ""
echo "Services:"
echo "  - Frontend: http://54.79.167.220"
echo "  - Backend API: http://54.79.167.220:8080/api"
echo "  - MinIO Console: http://54.79.167.220:9001"
echo ""
echo "To check logs:"
echo "  docker compose -f docker-compose.prod.yml logs"
echo ""

