#!/bin/bash

###############################################################################
# n8n Workflows Import Script
# Automatically imports all 4 workflows into n8n
###############################################################################

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║  n8n Workflows Import - AI Testing Agent              ║${NC}"
echo -e "${YELLOW}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Configuration
N8N_URL="http://38.97.60.181:5680"
WORKFLOWS_DIR="/Users/mqxerrormac16/Documents/QA  - Smart System/n8n-workflows"

# Check if API key is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: n8n API key required${NC}"
    echo ""
    echo "Usage: $0 <n8n-api-key>"
    echo ""
    echo "To get your API key:"
    echo "  1. Go to: http://38.97.60.181:5680"
    echo "  2. Login with: wassim / 5ty6%TY^5ty6"
    echo "  3. Click profile → Settings → API"
    echo "  4. Create API Key"
    echo "  5. Run: $0 YOUR_API_KEY"
    echo ""
    exit 1
fi

N8N_API_KEY="$1"

echo -e "${YELLOW}Testing API connection...${NC}"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X GET "${N8N_URL}/api/v1/workflows" \
  -H "X-N8N-API-KEY: ${N8N_API_KEY}")

if [ "$RESPONSE" != "200" ]; then
    echo -e "${RED}✗ API connection failed (HTTP ${RESPONSE})${NC}"
    echo "Please check your API key and try again."
    exit 1
fi

echo -e "${GREEN}✓ API connection successful${NC}"
echo ""

# Array of workflow files
WORKFLOWS=(
    "01-smoke-test-workflow.json"
    "02-performance-test-workflow.json"
    "03-full-suite-workflow.json"
    "04-scheduled-tests-workflow.json"
)

WORKFLOW_IDS=()

echo -e "${YELLOW}Importing workflows...${NC}"
echo ""

for WORKFLOW_FILE in "${WORKFLOWS[@]}"; do
    WORKFLOW_PATH="${WORKFLOWS_DIR}/${WORKFLOW_FILE}"
    WORKFLOW_NAME=$(cat "$WORKFLOW_PATH" | python3 -c "import sys, json; print(json.load(sys.stdin)['name'])")

    echo -n "Importing: ${WORKFLOW_NAME}... "

    # Import workflow
    RESULT=$(curl -s -X POST "${N8N_URL}/api/v1/workflows" \
      -H "X-N8N-API-KEY: ${N8N_API_KEY}" \
      -H "Content-Type: application/json" \
      -d @"${WORKFLOW_PATH}")

    # Check if successful
    WORKFLOW_ID=$(echo "$RESULT" | python3 -c "import sys, json; print(json.load(sys.stdin).get('id', ''))" 2>/dev/null || echo "")

    if [ -n "$WORKFLOW_ID" ]; then
        echo -e "${GREEN}✓ Imported (ID: ${WORKFLOW_ID})${NC}"
        WORKFLOW_IDS+=("$WORKFLOW_ID")
    else
        echo -e "${RED}✗ Failed${NC}"
        echo "Response: $RESULT"
    fi
done

echo ""
echo -e "${YELLOW}Activating workflows...${NC}"
echo ""

for WORKFLOW_ID in "${WORKFLOW_IDS[@]}"; do
    echo -n "Activating workflow ${WORKFLOW_ID}... "

    RESULT=$(curl -s -X PATCH "${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}" \
      -H "X-N8N-API-KEY: ${N8N_API_KEY}" \
      -H "Content-Type: application/json" \
      -d '{"active": true}')

    ACTIVE=$(echo "$RESULT" | python3 -c "import sys, json; print(json.load(sys.stdin).get('active', False))" 2>/dev/null || echo "false")

    if [ "$ACTIVE" = "True" ]; then
        echo -e "${GREEN}✓ Activated${NC}"
    else
        echo -e "${YELLOW}⚠ Check manually${NC}"
    fi
done

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║            ✓ Import Complete!                          ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Next steps:"
echo "  1. Go to n8n: http://38.97.60.181:5680"
echo "  2. Set up Airtable credential (Settings → Credentials)"
echo "  3. Update each workflow to use the Airtable credential"
echo "  4. Copy webhook URLs from each workflow"
echo "  5. Add buttons to Airtable with webhook URLs"
echo ""
echo "Webhook URLs will be:"
echo "  • Smoke Test: ${N8N_URL}/webhook/smoke-test"
echo "  • Performance: ${N8N_URL}/webhook/performance-test"
echo "  • Full Suite: ${N8N_URL}/webhook/full-suite"
echo ""
echo "See N8N_SETUP_GUIDE.md for detailed instructions."
echo ""
