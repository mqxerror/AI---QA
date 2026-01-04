#!/bin/bash

#######################################################################
# AI Website Testing Agent - Deployment Script
# Deploys the testing system to Mercan Server (38.97.60.181)
#######################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
MERCAN_HOST="38.97.60.181"
MERCAN_PORT="2222"
MERCAN_USER="root"
MERCAN_PASS="3F68ypfD1LOfcAd"
DEPLOY_PATH="/opt/testing-agent"

echo -e "${GREEN}=== AI Website Testing Agent - Deployment ===${NC}"
echo ""

# Check if sshpass is installed
if ! command -v sshpass &> /dev/null; then
    echo -e "${YELLOW}Installing sshpass for automated deployment...${NC}"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install hudochenkov/sshpass/sshpass
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo apt-get update && sudo apt-get install -y sshpass
    else
        echo -e "${RED}Please install sshpass manually${NC}"
        exit 1
    fi
fi

echo -e "${YELLOW}Step 1/6: Connecting to Mercan server...${NC}"

# Test SSH connection
sshpass -p "$MERCAN_PASS" ssh -p "$MERCAN_PORT" -o StrictHostKeyChecking=no "$MERCAN_USER@$MERCAN_HOST" "echo 'Connection successful'" || {
    echo -e "${RED}Failed to connect to Mercan server${NC}"
    exit 1
}

echo -e "${GREEN}✓ Connected to Mercan server${NC}"
echo ""

echo -e "${YELLOW}Step 2/6: Creating deployment directory...${NC}"

sshpass -p "$MERCAN_PASS" ssh -p "$MERCAN_PORT" -o StrictHostKeyChecking=no "$MERCAN_USER@$MERCAN_HOST" << 'EOF'
    mkdir -p /opt/testing-agent/{artifacts/{screenshots,videos,har,reports,k6},logs}
    echo "Deployment directory created"
EOF

echo -e "${GREEN}✓ Deployment directory ready${NC}"
echo ""

echo -e "${YELLOW}Step 3/6: Uploading project files...${NC}"

# Sync files to server (excluding node_modules and artifacts)
rsync -avz --progress \
    -e "sshpass -p $MERCAN_PASS ssh -p $MERCAN_PORT -o StrictHostKeyChecking=no" \
    --exclude='node_modules' \
    --exclude='artifacts' \
    --exclude='.git' \
    --exclude='logs' \
    --exclude='*.log' \
    ./ "$MERCAN_USER@$MERCAN_HOST:$DEPLOY_PATH/"

echo -e "${GREEN}✓ Files uploaded${NC}"
echo ""

echo -e "${YELLOW}Step 4/6: Setting up environment...${NC}"

sshpass -p "$MERCAN_PASS" ssh -p "$MERCAN_PORT" -o StrictHostKeyChecking=no "$MERCAN_USER@$MERCAN_HOST" << 'EOF'
    cd /opt/testing-agent

    # Create .env if it doesn't exist
    if [ ! -f .env ]; then
        cp .env.example .env
        echo "Created .env file - please configure it manually"
    fi

    # Make scripts executable
    chmod +x deploy.sh
EOF

echo -e "${GREEN}✓ Environment configured${NC}"
echo ""

echo -e "${YELLOW}Step 5/6: Starting Docker services...${NC}"

sshpass -p "$MERCAN_PASS" ssh -p "$MERCAN_PORT" -o StrictHostKeyChecking=no "$MERCAN_USER@$MERCAN_HOST" << 'EOF'
    cd /opt/testing-agent

    # Stop existing services
    docker-compose down 2>/dev/null || true

    # Pull latest images
    docker-compose pull

    # Build and start services
    docker-compose up -d --build

    # Wait for services to start
    echo "Waiting for services to start..."
    sleep 10

    # Check service status
    docker-compose ps
EOF

echo -e "${GREEN}✓ Docker services started${NC}"
echo ""

echo -e "${YELLOW}Step 6/6: Verifying deployment...${NC}"

# Test API health
sleep 5
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://$MERCAN_HOST:3001/api/health)

if [ "$HEALTH_CHECK" == "200" ]; then
    echo -e "${GREEN}✓ API is healthy!${NC}"
else
    echo -e "${RED}✗ API health check failed (HTTP $HEALTH_CHECK)${NC}"
    echo "Check logs with: ssh -p $MERCAN_PORT root@$MERCAN_HOST 'cd $DEPLOY_PATH && docker-compose logs test-api'"
fi

echo ""
echo -e "${GREEN}=== Deployment Complete ===${NC}"
echo ""
echo "Services:"
echo "  - Test API:       http://$MERCAN_HOST:3001"
echo "  - MinIO:          http://$MERCAN_HOST:9000"
echo "  - MinIO Console:  http://$MERCAN_HOST:9001"
echo ""
echo "Next steps:"
echo "  1. Configure .env file: ssh -p $MERCAN_PORT root@$MERCAN_HOST 'nano $DEPLOY_PATH/.env'"
echo "  2. Set up Airtable base (see AIRTABLE_SETUP_GUIDE.md)"
echo "  3. Import n8n workflows from n8n-workflows/ folder"
echo "  4. Test the system with: curl http://$MERCAN_HOST:3001/api/health"
echo ""
echo "View logs: ssh -p $MERCAN_PORT root@$MERCAN_HOST 'cd $DEPLOY_PATH && docker-compose logs -f'"
echo ""
