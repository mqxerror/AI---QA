#!/bin/bash

#######################################################################
# AI Website Testing Agent - AUTOMATED Deployment Script
# No confirmations - runs automatically
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
echo -e "${BLUE}║  AI Website Testing Agent - AUTO Deployment v1.0      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to run SSH command
ssh_run() {
    sshpass -p "$MERCAN_PASS" ssh -p "$MERCAN_PORT" -o StrictHostKeyChecking=no "$MERCAN_USER@$MERCAN_HOST" "$1"
}

echo -e "${YELLOW}═══ Step 1: Pre-Deployment Checks ═══${NC}"
echo ""

# Check SSH Connection
echo -n "Checking SSH connection... "
if ssh_run "echo 'OK'" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Connected${NC}"
else
    echo -e "${RED}✗ Failed${NC}"
    exit 1
fi

# Check Ports
echo -n "Checking ports (3003, 9002, 9003, 6380)... "
PORTS_IN_USE=$(ssh_run "netstat -tlnp 2>/dev/null | grep -E ':(3003|9002|9003|6380)' || echo 'NONE'")
if [ "$PORTS_IN_USE" = "NONE" ]; then
    echo -e "${GREEN}✓ All available${NC}"
else
    echo -e "${YELLOW}⚠ Some in use (will continue)${NC}"
fi

# Check Disk
echo -n "Checking disk space... "
DISK_AVAIL=$(ssh_run "df -h / | tail -1 | awk '{print \$4}'")
echo -e "${GREEN}✓ $DISK_AVAIL available${NC}"

echo ""
echo -e "${YELLOW}═══ Step 2: Creating Directory ═══${NC}"
ssh_run "mkdir -p $DEPLOY_PATH/{artifacts/{screenshots,videos,har,reports,k6},logs}"
echo -e "${GREEN}✓ Directory created${NC}"

echo ""
echo -e "${YELLOW}═══ Step 3: Uploading Files ═══${NC}"
rsync -az --progress \
    -e "sshpass -p $MERCAN_PASS ssh -p $MERCAN_PORT -o StrictHostKeyChecking=no" \
    --exclude='node_modules' \
    --exclude='artifacts' \
    --exclude='.git' \
    --exclude='logs' \
    ./ "$MERCAN_USER@$MERCAN_HOST:$DEPLOY_PATH/"

echo -e "${GREEN}✓ Files uploaded${NC}"

echo ""
echo -e "${YELLOW}═══ Step 4: Configuring Environment ═══${NC}"
ssh_run "cd $DEPLOY_PATH && cp .env.example .env && sed -i 's/your_minio_access_key/testing_agent_minio/g' .env && sed -i 's/your_minio_secret_key/testing_agent_secret_$(date +%s)/g' .env"
echo -e "${GREEN}✓ Environment configured${NC}"

echo ""
echo -e "${YELLOW}═══ Step 5: Stopping Any Existing Services ═══${NC}"
ssh_run "cd $DEPLOY_PATH && docker-compose down 2>/dev/null || true" || true
echo -e "${GREEN}✓ Cleaned up${NC}"

echo ""
echo -e "${YELLOW}═══ Step 6: Starting Services ═══${NC}"
echo "Starting MinIO..."
ssh_run "cd $DEPLOY_PATH && docker-compose up -d minio"
sleep 5

echo "Starting Redis..."
ssh_run "cd $DEPLOY_PATH && docker-compose up -d redis"
sleep 3

echo "Starting Test API..."
ssh_run "cd $DEPLOY_PATH && docker-compose up -d test-api"
sleep 10

echo ""
echo "Service Status:"
ssh_run "cd $DEPLOY_PATH && docker-compose ps"

echo ""
echo -e "${YELLOW}═══ Step 7: Verifying Deployment ═══${NC}"
echo "Waiting for API to initialize (10 seconds)..."
sleep 10

echo -n "Testing API health... "
HEALTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://$MERCAN_HOST:3003/api/health 2>/dev/null || echo "000")

if [ "$HEALTH_CODE" == "200" ]; then
    echo -e "${GREEN}✓ API is healthy!${NC}"
    echo ""
    echo "API Response:"
    curl -s http://$MERCAN_HOST:3003/api/health 2>/dev/null | python3 -m json.tool 2>/dev/null || curl -s http://$MERCAN_HOST:3003/api/health
else
    echo -e "${RED}✗ API health check failed (HTTP $HEALTH_CODE)${NC}"
    echo ""
    echo "Checking logs..."
    ssh_run "cd $DEPLOY_PATH && docker-compose logs --tail 30 test-api" || true
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           🎉 Deployment Complete! 🎉                   ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Services Running:"
echo -e "  ${BLUE}•${NC} Test API:       http://$MERCAN_HOST:3003"
echo -e "  ${BLUE}•${NC} MinIO:          http://$MERCAN_HOST:9002"
echo -e "  ${BLUE}•${NC} MinIO Console:  http://$MERCAN_HOST:9003"
echo -e "  ${BLUE}•${NC} Redis:          $MERCAN_HOST:6380"
echo ""
echo "Quick Tests:"
echo "  curl http://$MERCAN_HOST:3003/api/health"
echo ""
echo "  curl -X POST http://$MERCAN_HOST:3003/api/test/smoke \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"target_url\": \"https://google.com\", \"browser\": \"chromium\"}'"
echo ""
echo "View Logs:"
echo "  ssh -p $MERCAN_PORT $MERCAN_USER@$MERCAN_HOST"
echo "  cd $DEPLOY_PATH && docker-compose logs -f"
echo ""
echo "Next Steps:"
echo "  1. Set up Airtable base (see AIRTABLE_SETUP_GUIDE.md)"
echo "  2. Configure n8n workflows (see n8n-workflows/README.md)"
echo "  3. Test the system end-to-end"
echo ""
