#!/bin/bash

# Check existing installation on Mercan server
MERCAN_HOST="38.97.60.181"
MERCAN_PORT="2222"
MERCAN_USER="root"
MERCAN_PASS="3F68ypfD1LOfcAd"
DEPLOY_PATH="/opt/testing-agent"

echo "Checking existing installation on Mercan server..."
echo ""

sshpass -p "$MERCAN_PASS" ssh -p "$MERCAN_PORT" -o StrictHostKeyChecking=no "$MERCAN_USER@$MERCAN_HOST" << 'EOF'
echo "=== Installation Status ==="
if [ -d /opt/testing-agent ]; then
    echo "✓ Directory exists: /opt/testing-agent"

    echo ""
    echo "=== Docker Containers ==="
    cd /opt/testing-agent
    if [ -f docker-compose.yml ]; then
        docker-compose ps
    else
        echo "No docker-compose.yml found"
    fi

    echo ""
    echo "=== Files in Directory ==="
    ls -lah /opt/testing-agent/ | head -20

    echo ""
    echo "=== Ports in Use ==="
    netstat -tlnp | grep -E ':(3001|9000|9001|6379)' || echo "No ports in use"

    echo ""
    echo "=== API Health Check ==="
    curl -s http://localhost:3001/api/health 2>/dev/null || echo "API not responding"

else
    echo "✗ No installation found at /opt/testing-agent"
fi
EOF

echo ""
echo "What would you like to do?"
echo "1) Update existing installation"
echo "2) Remove and reinstall"
echo "3) Keep as is and just test"
