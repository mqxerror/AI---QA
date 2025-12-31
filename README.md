# QA Testing Dashboard

**Simple, clean React dashboard to manage website testing.**

Replaces n8n + Airtable with a lightweight solution that directly connects to your Test API.

---

## 🚀 Quick Start (Local Development)

### Backend

```bash
cd backend
npm install
npm run dev
```

Backend runs on: http://localhost:3004

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on: http://localhost:3005

---

## 🐳 Docker Deployment

### Local Testing

```bash
docker-compose up --build
```

- **Frontend**: http://localhost:3005
- **Backend API**: http://localhost:3004

### Deploy to Mercan Server

```bash
# Copy files to server
scp -P 2222 -r dashboard root@38.97.60.181:/opt/qa-dashboard

# SSH into server
ssh -p 2222 root@38.97.60.181

# Build and start
cd /opt/qa-dashboard
docker-compose up -d --build

# Check status
docker-compose ps
docker-compose logs -f
```

Access dashboard at: http://38.97.60.181:3005

---

## 📊 Features

### Dashboard Page
- **Live Stats**: Total websites, active websites, pass/fail rates
- **Recent Test Runs**: Last 10 test executions
- **Auto-refresh**: Updates every 10 seconds

### Websites Page
- **Manage Websites**: Add, edit, delete websites
- **One-Click Testing**:
  - ▶️ **Smoke Test** - Quick health check
  - ⚡ **Performance Test** - Lighthouse audit
- **Test History**: See total tests per website
- **Status Tracking**: Last result and test time

### Test Runs Page
- **Full Test History**: All test executions
- **Expandable Details**: Click to see individual test results
- **Performance Metrics**: LCP, FCP, TTFB, scores
- **Screenshots & Reports**: Links to MinIO assets

---

## 🗄️ Database

Uses **SQLite** for simplicity. Database file stored at:
- Local: `./database/qa-tests.db`
- Docker: `/app/database/qa-tests.db` (mounted volume)

### Tables:
- `websites` - Website configurations
- `test_runs` - Test execution records
- `test_results` - Individual test results
- `performance_metrics` - Lighthouse metrics

No migrations needed - tables auto-create on first run.

---

## 🔗 Architecture

```
┌─────────────────┐
│  React Frontend │  Port 3005
│    (Vite)       │
└────────┬────────┘
         │
         ↓ HTTP
┌─────────────────┐
│ Express Backend │  Port 3004
│    + SQLite     │
└────────┬────────┘
         │
         ↓ HTTP POST
┌─────────────────┐
│    Test API     │  Port 3003 (Mercan)
│ Playwright +    │
│  Lighthouse     │
└────────┬────────┘
         │
         ├──→ MinIO (Screenshots/Reports)
         └──→ Redis (Cache)
```

---

## 📝 API Endpoints

### Backend API (Port 3004)

**Websites:**
- `GET /api/websites` - List all websites
- `GET /api/websites/:id` - Get single website
- `POST /api/websites` - Create website
- `PUT /api/websites/:id` - Update website
- `DELETE /api/websites/:id` - Delete website

**Test Runs:**
- `GET /api/test-runs` - List test runs (supports filters)
- `GET /api/test-runs/:id` - Get test run with details
- `POST /api/run-test/smoke/:websiteId` - Run smoke test
- `POST /api/run-test/performance/:websiteId` - Run performance test

**Stats:**
- `GET /api/stats` - Dashboard statistics
- `GET /api/health` - Health check

---

## 🎨 Tech Stack

### Frontend
- **React 18** - UI framework
- **React Router** - Navigation
- **TanStack Query** - Data fetching & caching
- **Lucide Icons** - Icons
- **Vite** - Build tool
- **Nginx** - Production server (Docker)

### Backend
- **Express** - Web framework
- **Better-SQLite3** - Database
- **Axios** - HTTP client
- **CORS** - Cross-origin support

---

## 🔧 Configuration

### Backend Environment Variables

Edit `backend/.env`:

```env
PORT=3004
TEST_API_URL=http://38.97.60.181:3003
MINIO_URL=http://38.97.60.181:9002
DATABASE_PATH=./database/qa-tests.db
```

### Frontend Proxy

Frontend auto-proxies `/api` requests to backend (configured in `vite.config.js`).

---

## 🧪 Usage

### 1. Add a Website

1. Go to **Websites** page
2. Click **Add Website**
3. Enter name, URL, test frequency
4. Click **Add Website**

### 2. Run Tests

**Option 1: From Websites Page**
- Click **▶️ Smoke** for quick test
- Click **⚡ Perf** for performance audit

**Option 2: Via API**
```bash
# Smoke test
curl -X POST http://localhost:3004/api/run-test/smoke/1

# Performance test
curl -X POST http://localhost:3004/api/run-test/performance/1
```

### 3. View Results

- **Dashboard**: See recent runs and stats
- **Test Runs**: Click any run to expand details
- View screenshots and reports in expanded view

---

## 📦 Deployment Checklist

- [ ] Backend running on port 3004
- [ ] Frontend running on port 3005
- [ ] Test API accessible at http://38.97.60.181:3003
- [ ] MinIO accessible at http://38.97.60.181:9002
- [ ] Database directory has write permissions
- [ ] Can create websites
- [ ] Can run smoke tests
- [ ] Can run performance tests
- [ ] Results appear in Test Runs page

---

## 🚨 Troubleshooting

### Backend won't start
```bash
# Check if port 3004 is available
netstat -tlnp | grep 3004

# Check logs
docker-compose logs dashboard-backend
```

### Frontend can't reach backend
```bash
# Test backend health
curl http://localhost:3004/api/health

# Check network
docker network inspect qa-network
```

### Tests failing
```bash
# Test the Test API directly
curl http://38.97.60.181:3003/api/health

# Check Test API logs
ssh -p 2222 root@38.97.60.181
cd /opt/testing-agent
docker-compose logs test-api
```

### Database locked
```bash
# Stop all containers
docker-compose down

# Remove database lock
rm database/qa-tests.db-shm database/qa-tests.db-wal

# Restart
docker-compose up -d
```

---

## 🎯 Advantages Over n8n + Airtable

| Feature | n8n + Airtable | This Dashboard |
|---------|----------------|----------------|
| **Setup Time** | 2-3 hours | 10 minutes |
| **Credential Management** | Manual mapping | None needed |
| **Node Errors** | Frequent | Zero |
| **Speed** | Slow (multiple hops) | Fast (direct API) |
| **Cost** | Airtable limits | Free |
| **Customization** | Limited | Full control |
| **Dependencies** | 2 external services | Self-contained |

---

## 📄 License

MIT - Built for QA testing automation

---

**Need help?** Check the logs: `docker-compose logs -f`
