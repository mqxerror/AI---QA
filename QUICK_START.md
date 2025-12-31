# ⚡ Quick Start Guide

**Get the dashboard running in 5 minutes.**

---

## Option 1: Local Development (Fastest for Testing)

```bash
# Terminal 1 - Backend
cd dashboard/backend
npm install
npm start

# Terminal 2 - Frontend
cd dashboard/frontend
npm install
npm run dev
```

**Open:** http://localhost:3005

---

## Option 2: Docker (Production-like)

```bash
cd dashboard
docker-compose up --build
```

**Open:** http://localhost:3005

---

## Option 3: Deploy to Mercan Server

```bash
# From your local machine
cd "/Users/mqxerrormac16/Documents/QA  - Smart System"
tar -czf dashboard.tar.gz dashboard/
scp -P 2222 dashboard.tar.gz root@38.97.60.181:/opt/

# On the server
ssh -p 2222 root@38.97.60.181
cd /opt
tar -xzf dashboard.tar.gz
cd dashboard
mkdir -p database && chmod 777 database
docker-compose up -d --build
```

**Open:** http://38.97.60.181:3005

---

## First Steps in Dashboard

1. **Add Website**
   - Go to Websites page
   - Click "Add Website"
   - Name: `Google Test`
   - URL: `https://google.com`
   - Save

2. **Run Test**
   - Click "▶️ Smoke" button
   - Wait 20 seconds

3. **View Results**
   - Go to Dashboard or Test Runs
   - See your test results!

---

## What You Get

✅ **Clean UI** - Simple, fast, no clutter
✅ **One-Click Tests** - Smoke & Performance
✅ **Live Stats** - Pass/fail rates, metrics
✅ **Test History** - Full expandable details
✅ **Screenshots** - Auto-captured and linked
✅ **Reports** - Lighthouse HTML/JSON
✅ **No n8n** - No credential mapping
✅ **No Airtable** - No API limits

---

## Stack

- **React** - Frontend UI
- **Express** - Backend API
- **SQLite** - Database
- **Your Test API** - Already working!

---

**That's it!** No complex setup, no n8n node errors, no Airtable limits.

Just a simple dashboard that works.
