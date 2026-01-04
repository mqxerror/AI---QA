#!/bin/bash

#######################################################################
# AI Website Testing Agent - SAFE Deployment Script
# Includes pre-deployment checks and confirmations
#######################################################################

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
MERCAN_HOST="38.97.60.181"
MERCAN_PORT="2222"
MERCAN_USER="root"
MERCAN_PASS="3F68ypfD1LOfcAd"
DEPLOY_PATH="/opt/testing-agent"

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  AI Website Testing Agent - SAFE Deployment v1.0      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if sshpass is installed
if ! command -v sshpass &> /dev/null; then
    echo -e "${YELLOW}Installing sshpass...${NC}"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install hudochenkov/sshpass/sshpass || {
            echo -e "${RED}Failed to install sshpass. Please install manually: brew install hudochenkov/sshpass/sshpass${NC}"
            exit 1
        }
    fi
fi

echo -e "${YELLOW}═══ Step 1: Pre-Deployment Safety Checks ═══${NC}"
echo ""

# Function to run SSH command
ssh_run() {
    sshpass -p "$MERCAN_PASS" ssh -p "$MERCAN_PORT" -o StrictHostKeyChecking=no "$MERCAN_USER@$MERCAN_HOST" "$1"
}

# Check 1: SSH Connection
echo -n "Checking SSH connection... "
if ssh_run "echo 'OK'" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Connected${NC}"
else
    echo -e "${RED}✗ Failed${NC}"
    exit 1
fi

# Check 2: Port Availability
echo -n "Checking port availability... "
PORTS_IN_USE=$(ssh_run "netstat -tlnp 2>/dev/null | grep -E ':(3003|9002|9003|6380)' || echo 'NONE'")

if [ "$PORTS_IN_USE" = "NONE" ]; then
    echo -e "${GREEN}✓ All ports available${NC}"
else
    echo -e "${RED}✗ Some ports are in use:${NC}"
    echo "$PORTS_IN_USE"
    echo ""
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check 3: Disk Space
echo -n "Checking disk space... "
DISK_AVAIL=$(ssh_run "df -h / | tail -1 | awk '{print \$4}'")
echo -e "${GREEN}✓ Available: $DISK_AVAIL${NC}"

DISK_AVAIL_GB=$(ssh_run "df -BG / | tail -1 | awk '{print \$4}' | sed 's/G//'")
if [ "$DISK_AVAIL_GB" -lt 20 ]; then
    echo -e "${RED}⚠️  Warning: Less than 20GB free space${NC}"
    read -p "Continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check 4: Docker Status
echo -n "Checking Docker... "
if ssh_run "docker ps > /dev/null 2>&1"; then
    echo -e "${GREEN}✓ Docker is running${NC}"
else
    echo -e "${RED}✗ Docker not running or not installed${NC}"
    exit 1
fi

# Check 5: Existing Installation
echo -n "Checking for existing installation... "
if ssh_run "[ -d $DEPLOY_PATH ]"; then
    echo -e "${YELLOW}⚠️  Directory exists${NC}"
    echo ""
    echo "Found existing installation at $DEPLOY_PATH"
    echo "Options:"
    echo "  1) Remove and reinstall (DESTRUCTIVE)"
    echo "  2) Update existing installation (SAFE)"
    echo "  3) Cancel deployment"
    read -p "Choose option (1/2/3): " -n 1 -r
    echo

    case $REPLY in
        1)
            echo -e "${RED}Removing existing installation...${NC}"
            ssh_run "cd $DEPLOY_PATH && docker-compose down -v 2>/dev/null || true"
            ssh_run "rm -rf $DEPLOY_PATH"
            ;;
        2)
            echo -e "${YELLOW}Updating existing installation...${NC}"
            ;;
        3)
            echo "Deployment cancelled."
            exit 0
            ;;
        *)
            echo "Invalid option. Exiting."
            exit 1
            ;;
    esac
else
    echo -e "${GREEN}✓ Clean installation${NC}"
fi

echo ""
echo -e "${GREEN}═══ All Pre-Checks Passed ═══${NC}"
echo ""
echo "Deployment Summary:"
echo "  Target: $MERCAN_HOST:$MERCAN_PORT"
echo "  Path: $DEPLOY_PATH"
echo "  Ports: 3003 (API), 9002 (MinIO), 9003 (MinIO Console), 6380 (Redis)"
echo "  Disk: $DISK_AVAIL available"
echo ""
read -p "Proceed with deployment? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 0
fi

echo ""
echo -e "${YELLOW}═══ Step 2: Creating Directory Structure ═══${NC}"

ssh_run "mkdir -p $DEPLOY_PATH/{artifacts/{screenshots,videos,har,reports,k6},logs}"

echo -e "${GREEN}✓ Directory structure created${NC}"
echo ""

echo -e "${YELLOW}═══ Step 3: Uploading Files ═══${NC}"
echo ""

# Sync files
rsync -avz --progress \
    -e "sshpass -p $MERCAN_PASS ssh -p $MERCAN_PORT -o StrictHostKeyChecking=no" \
    --exclude='node_modules' \
    --exclude='artifacts' \
    --exclude='.git' \
    --exclude='logs' \
    --exclude='*.log' \
    ./ "$MERCAN_USER@$MERCAN_HOST:$DEPLOY_PATH/" || {
        echo -e "${RED}✗ File upload failed${NC}"
        exit 1
    }

echo -e "${GREEN}✓ Files uploaded${NC}"
echo ""

echo -e "${YELLOW}═══ Step 4: Configuring Environment ═══${NC}"

ssh_run "cd $DEPLOY_PATH && if [ ! -f .env ]; then cp .env.example .env; echo 'Created .env file'; else echo 'Using existing .env'; fi"

echo -e "${GREEN}✓ Environment configured${NC}"
echo ""

echo -e "${YELLOW}═══ Step 5: Starting Docker Services ═══${NC}"
echo ""

# Stop existing services gracefully
ssh_run "cd $DEPLOY_PATH && docker-compose down 2>/dev/null || true"

# Start services one by one
echo "Starting MinIO..."
ssh_run "cd $DEPLOY_PATH && docker-compose up -d minio"
sleep 3

echo "Starting Redis..."
ssh_run "cd $DEPLOY_PATH && docker-compose up -d redis"
sleep 2

echo "Starting Test API..."
ssh_run "cd $DEPLOY_PATH && docker-compose up -d test-api"
sleep 5

echo ""
ssh_run "cd $DEPLOY_PATH && docker-compose ps"

echo ""
echo -e "${GREEN}✓ Docker services started${NC}"
echo ""

echo -e "${YELLOW}═══ Step 6: Verifying Deployment ═══${NC}"
echo ""

# Wait for API to start
echo "Waiting for API to start (10 seconds)..."
sleep 10

# Test API health
echo -n "Testing API health... "
HEALTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://$MERCAN_HOST:3003/api/health)

if [ "$HEALTH_CODE" == "200" ]; then
    echo -e "${GREEN}✓ API is healthy!${NC}"

    # Get health details
    echo ""
    echo "API Response:"
    curl -s http://$MERCAN_HOST:3003/api/health | python3 -m json.tool 2>/dev/null || curl -s http://$MERCAN_HOST:3003/api/health

else
    echo -e "${RED}✗ API health check failed (HTTP $HEALTH_CODE)${NC}"
    echo ""
    echo "Checking logs..."
    ssh_run "cd $DEPLOY_PATH && docker-compose logs --tail 50 test-api"
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║            🎉 Deployment Complete! 🎉                  ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Services:"
echo -e "  ${BLUE}•${NC} Test API:       http://$MERCAN_HOST:3003"
echo -e "  ${BLUE}•${NC} MinIO:          http://$MERCAN_HOST:9002"
echo -e "  ${BLUE}•${NC} MinIO Console:  http://$MERCAN_HOST:9003"
echo ""
echo "Quick Tests:"
echo "  # Health check"
echo "  curl http://$MERCAN_HOST:3003/api/health"
echo ""
echo "  # Smoke test"
echo "  curl -X POST http://$MERCAN_HOST:3003/api/test/smoke \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"target_url\": \"https://variablelib.com\", \"browser\": \"chromium\"}'"
echo ""
echo "View Logs:"
echo "  ssh -p $MERCAN_PORT $MERCAN_USER@$MERCAN_HOST 'cd $DEPLOY_PATH && docker-compose logs -f'"
echo ""
echo "Next Steps:"
echo "  1. Configure .env file if needed"
echo "  2. Set up Airtable base (see AIRTABLE_SETUP_GUIDE.md)"
echo "  3. Import n8n workflows (see n8n-workflows/README.md)"
echo "  4. Test the system end-to-end"
echo ""
