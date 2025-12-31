# 🚀 Deploy Dashboard to Mercan Server

**Quick deployment guide for production.**

---

## Step 1: Copy Files to Server

```bash
cd "/Users/mqxerrormac16/Documents/QA  - Smart System"

# Create tar archive (faster than scp -r)
tar -czf dashboard.tar.gz dashboard/

# Copy to server
scp -P 2222 dashboard.tar.gz root@38.97.60.181:/opt/

# Clean up
rm dashboard.tar.gz
```

---

## Step 2: Extract and Setup on Server

```bash
# SSH into server
ssh -p 2222 root@38.97.60.181

# Extract
cd /opt
tar -xzf dashboard.tar.gz
cd dashboard

# Create database directory
mkdir -p database
chmod 777 database
```

---

## Step 3: Deploy with Docker

```bash
# Build and start
docker-compose up -d --build

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

**Expected output:**
```
qa-dashboard-backend    running    0.0.0.0:3004->3004/tcp
qa-dashboard-frontend   running    0.0.0.0:3005->80/tcp
```

---

## Step 4: Verify Deployment

```bash
# Test backend health
curl http://localhost:3004/api/health

# Test frontend (from your local machine)
curl http://38.97.60.181:3005
```

---

## Step 5: Access Dashboard

**Open in browser:**
```
http://38.97.60.181:3005
```

---

## Step 6: Add First Website

1. Click **Websites** → **Add Website**
2. Name: `Google Test`
3. URL: `https://google.com`
4. Frequency: `Manual`
5. Click **Add Website**

---

## Step 7: Run First Test

1. Click **▶️ Smoke** button
2. Wait 10-30 seconds
3. Go to **Test Runs** page
4. Click the run to see details

---

## ✅ Success Indicators

- ✅ Dashboard loads at http://38.97.60.181:3005
- ✅ Backend health check returns `{"status": "healthy"}`
- ✅ Can create websites
- ✅ Smoke tests complete successfully
- ✅ Performance tests generate Lighthouse reports
- ✅ Test results visible in dashboard
- ✅ Screenshots accessible in MinIO

---

## 🔧 Useful Commands

```bash
# View logs
docker-compose logs -f dashboard-backend
docker-compose logs -f dashboard-frontend

# Restart services
docker-compose restart

# Stop services
docker-compose stop

# Remove and rebuild
docker-compose down
docker-compose up -d --build

# Check database
sqlite3 database/qa-tests.db "SELECT * FROM websites;"
sqlite3 database/qa-tests.db "SELECT * FROM test_runs;"

# Monitor resource usage
docker stats
```

---

## 🎯 Integration with Existing Test API

The dashboard automatically connects to your existing Test API:

```
Dashboard Backend (Port 3004)
     ↓
Test API (Port 3003)
     ↓
Playwright + Lighthouse
     ↓
MinIO (Port 9002) - Screenshots/Reports
```

No changes needed to Test API - it continues working as before.

---

## 🔄 Updates

To update the dashboard:

```bash
# Local: make changes and create new archive
cd "/Users/mqxerrormac16/Documents/QA  - Smart System"
tar -czf dashboard.tar.gz dashboard/
scp -P 2222 dashboard.tar.gz root@38.97.60.181:/opt/

# Server: extract and rebuild
ssh -p 2222 root@38.97.60.181
cd /opt
tar -xzf dashboard.tar.gz
cd dashboard
docker-compose up -d --build
```

---

**Deployment time:** ~5 minutes
**Zero n8n headaches!** 🎉
