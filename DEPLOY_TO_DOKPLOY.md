# 🚀 Deploy QA Dashboard to mercan-emploi.com via Dokploy

**Deployment to your existing Dokploy instance at 38.97.60.181**

---

## ⚡ Quick Deploy (5 Steps - 15 Minutes)

### Step 1: Generate Secure Credentials (1 min)

```bash
cd "/Users/mqxerrormac16/Documents/QA  - Smart System/dashboard"
node generate-secrets.js
```

**Save the output** - you'll need `JWT_SECRET` and `ADMIN_PASSWORD`.

---

### Step 2: Upload Code to Server (2 min)

```bash
cd "/Users/mqxerrormac16/Documents/QA  - Smart System"

# Create archive (excluding node_modules for faster upload)
tar -czf qa-dashboard.tar.gz \
  --exclude='node_modules' \
  --exclude='dist' \
  --exclude='.git' \
  --exclude='backend/database' \
  --exclude='backend/screenshots' \
  --exclude='backend/reports' \
  dashboard/

# Upload to your server
scp -P 2222 qa-dashboard.tar.gz root@38.97.60.181:/opt/

# Extract on server
ssh -p 2222 root@38.97.60.181 << 'EOF'
cd /opt
rm -rf dashboard  # Remove old version if exists
tar -xzf qa-dashboard.tar.gz
chown -R root:root dashboard
chmod -R 755 dashboard
echo "✅ Code uploaded and extracted to /opt/dashboard"
EOF
```

---

### Step 3: Configure DNS for mercan-emploi.com (5 min)

Add these DNS records at your domain registrar:

| Type | Name | Value          | TTL  |
|------|------|----------------|------|
| A    | @    | 38.97.60.181   | 3600 |
| A    | www  | 38.97.60.181   | 3600 |

**Verify DNS is updated:**
```bash
dig mercan-emploi.com +short
# Should return: 38.97.60.181
```

⏱️ DNS propagation usually takes 5-30 minutes.

---

### Step 4: Deploy in Dokploy (5 min)

#### Option A: Deploy via Dokploy UI (Recommended)

1. **Open Dokploy**: http://38.97.60.181:3000

2. **Create New Application**:
   - Click **"Create Application"** or **"+"**
   - Type: **Docker Compose**
   - Name: `qa-dashboard`
   - Description: `QA Testing Dashboard with 8 test types`

3. **Configure Source**:
   - Source Type: **Git** or **Directory**
   - If Directory: `/opt/dashboard`
   - Build: **Docker Compose**
   - Compose File: `docker-compose.yml` (auto-detected)

4. **Environment Variables** (click "Add Variable"):
   ```
   JWT_SECRET=<paste-from-step-1>
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=<paste-from-step-1>
   ```

5. **Configure Domain**:
   - Click **"Domains"** tab
   - Add domain: `mercan-emploi.com`
   - Enable HTTPS: ✅
   - SSL Provider: **Let's Encrypt**
   - Certificate: Auto-generate
   - Port: **3005** (frontend port)
   - Path: `/` (root)

6. **Deploy**:
   - Click **"Deploy"** button
   - Monitor build logs
   - Wait ~5-10 minutes

---

#### Option B: Deploy via Dokploy API

```bash
# Create project
curl -X POST 'http://38.97.60.181:3000/api/project.create' \
  -H 'x-api-key: qaBFTnweBNakQRcFNdQyFbsfnYhGxaKlDRDnhqtdfEdSrwOVmJJTofWXiVKHEYgC' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "QA Testing",
    "description": "QA Dashboard and Testing Infrastructure"
  }'

# Note the projectId from response, then create compose application
curl -X POST 'http://38.97.60.181:3000/api/compose.create' \
  -H 'x-api-key: qaBFTnweBNakQRcFNdQyFbsfnYhGxaKlDRDnhqtdfEdSrwOVmJJTofWXiVKHEYgC' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "qa-dashboard",
    "description": "QA Testing Dashboard",
    "projectId": "<PROJECT_ID_FROM_ABOVE>",
    "composePath": "/opt/dashboard/docker-compose.yml",
    "env": {
      "JWT_SECRET": "<your-jwt-secret>",
      "ADMIN_USERNAME": "admin",
      "ADMIN_PASSWORD": "<your-admin-password>"
    }
  }'
```

---

### Step 5: Verify Deployment (2 min)

Wait for DNS propagation and deployment to complete, then:

```bash
# Check backend health
curl https://mercan-emploi.com/api/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "dashboard": true,
  "test_api": true,
  "database": true
}
```

**Open in browser:**
```
https://mercan-emploi.com
```

You should see the login page!

---

## 🔧 Post-Deployment

### First Login

1. Navigate to https://mercan-emploi.com
2. Username: `admin`
3. Password: `<the password from Step 1>`
4. Click **Login**

### Add Your First Test Website

1. Go to **Websites** → **Add Website**
2. Name: `Google Test`
3. URL: `https://google.com`
4. Test Frequency: `Manual`
5. Click **Add Website**

### Run Your First Test

1. Click **▶️ Smoke** next to the website
2. Wait 10-30 seconds
3. Go to **Test Runs** page
4. Click the test run to see results
5. Download the PDF report!

---

## 📊 Monitor Deployment

### Via Dokploy UI

1. Open http://38.97.60.181:3000
2. Go to your **qa-dashboard** application
3. Click **"Logs"** tab
4. Select container to view logs

### Via SSH

```bash
ssh -p 2222 root@38.97.60.181

# Check containers
docker ps | grep qa-dashboard

# View backend logs
docker logs qa-dashboard-backend --tail 100 -f

# View frontend logs
docker logs qa-dashboard-frontend --tail 100 -f

# Check health
docker exec qa-dashboard-backend wget -q -O- http://localhost:3004/api/health
```

---

## 🔄 Update Application

When you make changes:

```bash
# Local machine - create new archive
cd "/Users/mqxerrormac16/Documents/QA  - Smart System"
tar -czf qa-dashboard.tar.gz --exclude='node_modules' dashboard/
scp -P 2222 qa-dashboard.tar.gz root@38.97.60.181:/opt/

# Server - extract
ssh -p 2222 root@38.97.60.181 "cd /opt && tar -xzf qa-dashboard.tar.gz"

# Dokploy - redeploy
# Option 1: Via UI - click "Redeploy" button
# Option 2: Via API
curl -X POST 'http://38.97.60.181:3000/api/compose.reload' \
  -H 'x-api-key: qaBFTnweBNakQRcFNdQyFbsfnYhGxaKlDRDnhqtdfEdSrwOVmJJTofWXiVKHEYgC' \
  -H 'Content-Type: application/json' \
  -d '{"composeId": "<YOUR_COMPOSE_ID>"}'
```

---

## 🔒 Security Checklist

✅ **Strong JWT Secret** - Generated in Step 1
✅ **Strong Admin Password** - Generated in Step 1
✅ **HTTPS/SSL** - Let's Encrypt configured
✅ **Firewall** - Already configured (UFW active)
✅ **SSH** - Port 2222 with Fail2Ban
✅ **CORS** - Limited to mercan-emploi.com
✅ **Rate Limiting** - Configured in backend

---

## 🐛 Troubleshooting

### Domain Not Loading

**Check DNS:**
```bash
dig mercan-emploi.com +short
```
Should return `38.97.60.181`. If not, wait 30 minutes for propagation.

**Check Nginx:**
```bash
ssh -p 2222 root@38.97.60.181
nginx -t
systemctl status nginx
```

### SSL Certificate Error

**In Dokploy:**
1. Go to application → Domains
2. Click **"Regenerate Certificate"**
3. Ensure ports 80 and 443 are open

**Via SSH:**
```bash
# Check certbot
certbot certificates

# Manually renew
certbot renew --force-renewal
systemctl reload nginx
```

### Backend Not Responding

```bash
ssh -p 2222 root@38.97.60.181

# Check if Test API is running (required dependency)
curl http://38.97.60.181:3003/api/health

# If Test API is down, restart it
docker ps -a | grep test-api
docker restart <test-api-container>

# Check backend logs
docker logs qa-dashboard-backend --tail 50
```

### Tests Failing

**Verify dependencies:**
```bash
# Test API should respond
curl http://38.97.60.181:3003/api/health

# MinIO should respond (for screenshots)
curl http://38.97.60.181:9002/minio/health/live
```

### Database Issues

```bash
ssh -p 2222 root@38.97.60.181

# Find database volume
docker volume ls | grep qa-database

# Inspect volume
docker volume inspect qa_qa-database

# Backup database
docker run --rm \
  -v qa_qa-database:/data \
  -v /root/backups:/backup \
  alpine \
  tar -czf /backup/qa-dashboard-db-$(date +%Y%m%d).tar.gz -C /data .
```

---

## 📈 Performance Monitoring

### Resource Usage

```bash
ssh -p 2222 root@38.97.60.181

# Container stats
docker stats qa-dashboard-backend qa-dashboard-frontend

# Disk usage
docker system df
df -h /var/lib/docker

# Memory
free -h
```

### Application Metrics

Access these endpoints:

```bash
# Health check
curl https://mercan-emploi.com/api/health

# Stats (requires authentication)
curl https://mercan-emploi.com/api/stats \
  -H "Authorization: Bearer <your-jwt-token>"
```

---

## 🗄️ Backup Strategy

### Database Backup (Automated)

Create cron job on server:

```bash
ssh -p 2222 root@38.97.60.181

# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * docker run --rm -v qa_qa-database:/data -v /root/backups:/backup alpine tar -czf /backup/qa-dashboard-db-$(date +\%Y\%m\%d).tar.gz -C /data .
```

### Manual Backup

```bash
ssh -p 2222 root@38.97.60.181

# Backup database
docker run --rm \
  -v qa_qa-database:/data \
  -v /root/backups:/backup \
  alpine \
  tar -czf /backup/qa-dashboard-db-backup.tar.gz -C /data .

# Backup reports
docker run --rm \
  -v qa_qa-reports:/data \
  -v /root/backups:/backup \
  alpine \
  tar -czf /backup/qa-dashboard-reports-backup.tar.gz -C /data .

# Backup screenshots
docker run --rm \
  -v qa_qa-screenshots:/data \
  -v /root/backups:/backup \
  alpine \
  tar -czf /backup/qa-dashboard-screenshots-backup.tar.gz -C /data .
```

---

## 🎯 Architecture Overview

```
Internet
   │
   ├─── HTTPS (443) ──► Nginx (Dokploy Managed)
   │                      │
   │                      └─► mercan-emploi.com → qa-dashboard-frontend:80
   │                                                  │
   │                                                  ├─ /api → backend:3004
   │                                                  ├─ /reports → backend:3004
   │                                                  └─ /socket.io → backend:3004
   │
   └─── Backend Services
           │
           ├─ QA Dashboard Backend (Port 3004)
           │     ├─ WebSocket Server
           │     ├─ REST API
           │     └─ PDF Generator
           │
           ├─ Test API (Port 3003) ← Existing Service
           │     ├─ Playwright Tests
           │     ├─ Lighthouse Tests
           │     └─ Security Scans
           │
           └─ MinIO (Port 9002) ← Existing Service
                 └─ Screenshot Storage
```

---

## ✅ Deployment Success Checklist

- [ ] Code uploaded to `/opt/dashboard`
- [ ] DNS points to 38.97.60.181
- [ ] Dokploy application created
- [ ] Environment variables set
- [ ] Domain configured with SSL
- [ ] Application deployed successfully
- [ ] Health check returns 200 OK
- [ ] Can login to dashboard
- [ ] Can add websites
- [ ] Can run tests
- [ ] PDF reports download
- [ ] Screenshots visible

---

## 📞 Support

**Your Infrastructure:**
- Main Server: 38.97.60.181 (Port 2222)
- Dokploy: http://38.97.60.181:3000
- Test API: http://38.97.60.181:3003
- MinIO: http://38.97.60.181:9002

**Similar Deployment:**
You already successfully deployed **Google Ads AI Manager** (ads.mercan.com) using Dokploy, so this process should be familiar!

---

**Deployment Time:** ~15-20 minutes
**Difficulty:** Easy (you've done this before with ads.mercan.com!)

Let's deploy! 🚀
