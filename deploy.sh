#!/bin/bash

# sosAI Deployment Script for Hetzner
# Usage: ./deploy.sh [production|staging]

set -e

ENVIRONMENT=${1:-staging}
SERVER_IP=${SERVER_IP:-"your-hetzner-server-ip"}
SERVER_USER=${SERVER_USER:-"root"}

echo "🚀 Deploying sosAI to $ENVIRONMENT environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required environment variables are set
check_env_vars() {
    print_status "Checking environment variables..."
    
    if [ -z "$ANTHROPIC_API_KEY" ]; then
        print_error "ANTHROPIC_API_KEY is not set!"
        exit 1
    fi
    
    if [ -z "$SERVER_IP" ] || [ "$SERVER_IP" = "your-hetzner-server-ip" ]; then
        print_error "Please set SERVER_IP environment variable with your Hetzner server IP"
        exit 1
    fi
    
    print_status "Environment variables OK"
}

# Build and deploy
deploy() {
    print_status "Building Docker images..."
    
    # Build images
    docker build -f Dockerfile.backend -t sosai-backend:latest .
    docker build -f Dockerfile.frontend -t sosai-frontend:latest .
    
    print_status "Saving images to tar files..."
    docker save sosai-backend:latest | gzip > sosai-backend.tar.gz
    docker save sosai-frontend:latest | gzip > sosai-frontend.tar.gz
    
    print_status "Uploading to server..."
    scp sosai-backend.tar.gz sosai-frontend.tar.gz docker-compose.yml .env $SERVER_USER@$SERVER_IP:/opt/sosai/
    
    print_status "Deploying on server..."
    ssh $SERVER_USER@$SERVER_IP << 'EOF'
        cd /opt/sosai
        
        # Load images
        docker load < sosai-backend.tar.gz
        docker load < sosai-frontend.tar.gz
        
        # Stop existing containers
        docker-compose down || true
        
        # Start new containers
        docker-compose up -d
        
        # Cleanup
        rm sosai-backend.tar.gz sosai-frontend.tar.gz
        docker system prune -f
EOF
    
    # Cleanup local files
    rm sosai-backend.tar.gz sosai-frontend.tar.gz
    
    print_status "Deployment complete! 🎉"
    print_status "Your application should be available at: http://$SERVER_IP"
}

# Server setup (run once)
setup_server() {
    print_status "Setting up server..."
    
    ssh $SERVER_USER@$SERVER_IP << 'EOF'
        # Update system
        apt update && apt upgrade -y
        
        # Install Docker
        curl -fsSL https://get.docker.com -o get-docker.sh
        sh get-docker.sh
        
        # Install Docker Compose
        curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
        
        # Create application directory
        mkdir -p /opt/sosai
        
        # Setup firewall
        ufw allow 22
        ufw allow 80
        ufw allow 443
        ufw --force enable
        
        # Setup log rotation
        echo '/var/log/nginx/*.log {
            daily
            missingok
            rotate 52
            compress
            delaycompress
            notifempty
            create 644 nginx nginx
            postrotate
                docker exec nginx nginx -s reload
            endscript
        }' > /etc/logrotate.d/nginx
EOF
    
    print_status "Server setup complete!"
}

# Main execution
case "$1" in
    "setup")
        check_env_vars
        setup_server
        ;;
    "production"|"staging"|"")
        check_env_vars
        deploy
        ;;
    *)
        echo "Usage: $0 [setup|production|staging]"
        echo "  setup      - Initial server setup (run once)"
        echo "  production - Deploy to production"
        echo "  staging    - Deploy to staging (default)"
        exit 1
        ;;
esac
