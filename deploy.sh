#!/bin/bash

# QA Dashboard - Automated Deployment to Dokploy
# Deploys to mercan-emploi.com via Dokploy at 38.97.60.181

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SERVER_IP="38.97.60.181"
SSH_PORT="2222"
SSH_USER="root"
DOKPLOY_URL="http://38.97.60.181:3000"
DOKPLOY_API_KEY="qaBFTnweBNakQRcFNdQyFbsfnYhGxaKlDRDnhqtdfEdSrwOVmJJTofWXiVKHEYgC"
DOMAIN="mercan-emploi.com"
DEPLOY_PATH="/opt/dashboard"

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════╗"
echo "║   QA Dashboard - Automated Deployment to Dokploy     ║"
echo "║   Target: mercan-emploi.com                           ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Step 1: Generate credentials
echo -e "\n${YELLOW}[1/6] Generating secure credentials...${NC}"
if [ ! -f "generate-secrets.js" ]; then
    echo -e "${RED}Error: generate-secrets.js not found!${NC}"
    exit 1
fi

CREDENTIALS=$(node generate-secrets.js 2>/dev/null | grep -A 2 "Add these to Dokploy")
JWT_SECRET=$(echo "$CREDENTIALS" | grep "JWT_SECRET=" | cut -d'=' -f2)
ADMIN_PASSWORD=$(echo "$CREDENTIALS" | grep "ADMIN_PASSWORD=" | cut -d'=' -f2)

if [ -z "$JWT_SECRET" ] || [ -z "$ADMIN_PASSWORD" ]; then
    echo -e "${RED}Error: Failed to generate credentials${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Credentials generated${NC}"
echo -e "${BLUE}  Admin Username: admin${NC}"
echo -e "${BLUE}  Admin Password: ${ADMIN_PASSWORD}${NC}"
echo -e "${YELLOW}  ⚠️  Save these credentials in a password manager!${NC}"

# Save credentials to file
cat > .env.production << EOF
JWT_SECRET=${JWT_SECRET}
ADMIN_USERNAME=admin
ADMIN_PASSWORD=${ADMIN_PASSWORD}
EOF
echo -e "${GREEN}✓ Credentials saved to .env.production${NC}"

# Step 2: Create deployment archive
echo -e "\n${YELLOW}[2/6] Creating deployment archive...${NC}"
cd ..
tar -czf qa-dashboard.tar.gz \
    --exclude='node_modules' \
    --exclude='dist' \
    --exclude='.git' \
    --exclude='backend/database' \
    --exclude='backend/screenshots' \
    --exclude='backend/reports' \
    --exclude='frontend/node_modules' \
    dashboard/

echo -e "${GREEN}✓ Archive created: $(du -h qa-dashboard.tar.gz | cut -f1)${NC}"

# Step 3: Upload to server
echo -e "\n${YELLOW}[3/6] Uploading code to server...${NC}"
scp -P ${SSH_PORT} qa-dashboard.tar.gz ${SSH_USER}@${SERVER_IP}:/opt/
echo -e "${GREEN}✓ Code uploaded${NC}"

# Step 4: Extract on server
echo -e "\n${YELLOW}[4/6] Extracting code on server...${NC}"
ssh -p ${SSH_PORT} ${SSH_USER}@${SERVER_IP} << 'ENDSSH'
cd /opt
rm -rf dashboard_old
[ -d dashboard ] && mv dashboard dashboard_old
tar -xzf qa-dashboard.tar.gz
chown -R root:root dashboard
chmod -R 755 dashboard
echo "✓ Code extracted to /opt/dashboard"
ENDSSH
echo -e "${GREEN}✓ Code extracted and ready${NC}"

# Step 5: Check DNS
echo -e "\n${YELLOW}[5/6] Checking DNS configuration...${NC}"
DNS_IP=$(dig +short ${DOMAIN} @8.8.8.8 | head -1)
if [ "$DNS_IP" = "$SERVER_IP" ]; then
    echo -e "${GREEN}✓ DNS correctly points to ${SERVER_IP}${NC}"
else
    echo -e "${RED}⚠️  Warning: DNS points to ${DNS_IP} instead of ${SERVER_IP}${NC}"
    echo -e "${YELLOW}   Please update your DNS A record:${NC}"
    echo -e "${BLUE}   Type: A${NC}"
    echo -e "${BLUE}   Name: @${NC}"
    echo -e "${BLUE}   Value: ${SERVER_IP}${NC}"
    echo ""
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Step 6: Deploy instructions
echo -e "\n${YELLOW}[6/6] Ready to deploy!${NC}"
echo ""
echo -e "${BLUE}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           Next Steps - Deploy in Dokploy             ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}1. Open Dokploy:${NC} ${DOKPLOY_URL}"
echo ""
echo -e "${GREEN}2. Create New Application:${NC}"
echo "   - Click 'Create Application'"
echo "   - Type: Docker Compose"
echo "   - Name: qa-dashboard"
echo ""
echo -e "${GREEN}3. Configure Source:${NC}"
echo "   - Source Type: Directory"
echo "   - Path: ${DEPLOY_PATH}"
echo "   - Compose File: docker-compose.yml"
echo ""
echo -e "${GREEN}4. Add Environment Variables:${NC}"
echo "   JWT_SECRET=${JWT_SECRET}"
echo "   ADMIN_USERNAME=admin"
echo "   ADMIN_PASSWORD=${ADMIN_PASSWORD}"
echo ""
echo -e "${GREEN}5. Configure Domain:${NC}"
echo "   - Domain: ${DOMAIN}"
echo "   - HTTPS: Enabled"
echo "   - SSL: Let's Encrypt"
echo "   - Port: 3005"
echo ""
echo -e "${GREEN}6. Click 'Deploy'${NC}"
echo ""
echo -e "${BLUE}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              Or Deploy via Dokploy API                ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Run these commands to deploy via API:"
echo ""
echo -e "${YELLOW}# Note: Replace <PROJECT_ID> with your project ID${NC}"
echo ""
echo "curl -X POST '${DOKPLOY_URL}/api/compose.create' \\"
echo "  -H 'x-api-key: ${DOKPLOY_API_KEY}' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{"
echo '    "name": "qa-dashboard",'
echo '    "description": "QA Testing Dashboard",'
echo '    "projectId": "<PROJECT_ID>",'
echo "    \"composePath\": \"${DEPLOY_PATH}/docker-compose.yml\","
echo '    "env": {'
echo "      \"JWT_SECRET\": \"${JWT_SECRET}\","
echo '      "ADMIN_USERNAME": "admin",'
echo "      \"ADMIN_PASSWORD\": \"${ADMIN_PASSWORD}\""
echo "    }"
echo "  }'"
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Deployment preparation complete!${NC}"
echo ""
echo -e "${YELLOW}⚠️  Important:${NC}"
echo "   - Your credentials are saved in: .env.production"
echo "   - Login to dashboard at: https://${DOMAIN}"
echo "   - Username: admin"
echo "   - Password: ${ADMIN_PASSWORD}"
echo ""
echo -e "${GREEN}After deployment, verify:${NC}"
echo "   curl https://${DOMAIN}/api/health"
echo ""
