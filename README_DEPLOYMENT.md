# 🚀 QA Dashboard - Ready for Deployment

Your QA Dashboard is **ready to deploy** to **mercan-emploi.com** using your existing Dokploy setup!

---

## ⚡ One-Command Deployment

Run this automated script to prepare everything:

```bash
cd "/Users/mqxerrormac16/Documents/QA  - Smart System/dashboard"
./deploy.sh
```

This script will:
1. ✅ Generate secure credentials (JWT secret & admin password)
2. ✅ Create deployment archive
3. ✅ Upload code to your server (38.97.60.181)
4. ✅ Extract code to `/opt/dashboard`
5. ✅ Verify DNS configuration
6. ✅ Show you the next steps

**Time:** ~2 minutes

---

## 📖 Step-by-Step Guides

Choose your preferred method:

### 🎯 Quick Deploy (Recommended)
**File:** `DEPLOY_TO_DOKPLOY.md`
- 5 simple steps
- Takes 15-20 minutes
- Uses your existing Dokploy at 38.97.60.181
- Includes automated script

### 📚 Detailed Guide
**File:** `DOCKPLOY_DEPLOYMENT.md`
- Comprehensive instructions
- Troubleshooting section
- Backup strategies
- Performance monitoring

### ⚡ Super Quick Reference
**File:** `QUICK_DEPLOY_GUIDE.md`
- 5-step quick reference
- Perfect for experienced users

---

## 🛠️ What's Been Prepared

### ✅ Production-Ready Configuration

**Docker:**
- `docker-compose.yml` - Production config with health checks
- `frontend/Dockerfile` - Nginx with WebSocket, reports, and API proxy
- `backend/Dockerfile` - Node.js with Playwright and health checks
- `.dockerignore` - Optimized build times

**Security:**
- `generate-secrets.js` - Secure credential generator
- `.env.production` template - Production environment variables
- HTTPS/SSL ready (Let's Encrypt via Dokploy)
- CORS configured for mercan-emploi.com only
- Rate limiting enabled

**Deployment:**
- `deploy.sh` - Automated deployment script
- Ready for your Dokploy instance (38.97.60.181:3000)

---

## 🎯 Your Infrastructure

Based on `SERVER_INFRASTRUCTURE_REFERENCE.md`:

| Service | URL | Status |
|---------|-----|--------|
| **Dokploy** | http://38.97.60.181:3000 | ✅ Active |
| **Server SSH** | ssh -p 2222 root@38.97.60.181 | ✅ Active |
| **Test API** | http://38.97.60.181:3003 | ✅ Required Dependency |
| **MinIO** | http://38.97.60.181:9002 | ✅ Required Dependency |

**You've already successfully deployed:**
- ✅ Google Ads AI Manager (ads.mercan.com) - via Dokploy

So deploying the QA Dashboard will be familiar!

---

## 🚀 Quick Start

### Option 1: Automated Deployment (Easiest)

```bash
cd "/Users/mqxerrormac16/Documents/QA  - Smart System/dashboard"
./deploy.sh
```

Then follow the instructions to complete deployment in Dokploy UI.

---

### Option 2: Manual Steps

1. **Generate credentials:**
   ```bash
   node generate-secrets.js
   ```

2. **Upload code:**
   ```bash
   cd "/Users/mqxerrormac16/Documents/QA  - Smart System"
   tar -czf qa-dashboard.tar.gz --exclude='node_modules' dashboard/
   scp -P 2222 qa-dashboard.tar.gz root@38.97.60.181:/opt/
   ssh -p 2222 root@38.97.60.181 "cd /opt && tar -xzf qa-dashboard.tar.gz"
   ```

3. **Configure DNS** (if not already done):
   - Add A record: `@ → 38.97.60.181`
   - Add A record: `www → 38.97.60.181`

4. **Deploy in Dokploy:**
   - Open http://38.97.60.181:3000
   - Create Docker Compose application
   - Point to `/opt/dashboard`
   - Add environment variables (from step 1)
   - Configure domain: mercan-emploi.com with HTTPS
   - Click Deploy!

5. **Verify:**
   ```bash
   curl https://mercan-emploi.com/api/health
   ```

---

## 🎨 What You'll Get

Once deployed at **https://mercan-emploi.com**, you'll have:

### 🧪 8 Test Types
1. **Smoke Tests** - Basic functionality checks
2. **Performance** - Lighthouse metrics & Core Web Vitals
3. **Accessibility** - WCAG compliance with axe-core
4. **Security Scan** - SSL, headers, vulnerabilities
5. **SEO Audit** - Meta tags, structure, best practices
6. **Visual Regression** - Screenshot comparison (desktop/tablet/mobile)
7. **Link Checker** - Broken links detection
8. **Forms Testing** - Form validation and submission

### 📊 Features
- ✅ **PDF Reports** - Download detailed reports with screenshots
- ✅ **Real-time Updates** - WebSocket for live test progress
- ✅ **Multi-Website** - Test multiple sites from one dashboard
- ✅ **Scheduled Tests** - Daily/Weekly automated testing
- ✅ **Activity Logs** - Track all actions and changes
- ✅ **Process Monitoring** - View running tests
- ✅ **Authentication** - Secure JWT-based login
- ✅ **Responsive UI** - Works on desktop/tablet/mobile

---

## 📋 Pre-Deployment Checklist

- [ ] Server accessible via SSH (38.97.60.181:2222)
- [ ] Dokploy running at http://38.97.60.181:3000
- [ ] Test API running at http://38.97.60.181:3003
- [ ] MinIO running at http://38.97.60.181:9002
- [ ] DNS access to mercan-emploi.com
- [ ] Ports 80 and 443 open for HTTPS

---

## 🎯 After Deployment

### First Login
- URL: https://mercan-emploi.com
- Username: `admin`
- Password: (from generate-secrets.js output)

### Add Your First Website
1. Click "Websites" → "Add Website"
2. Add any website you want to test
3. Run a Smoke test
4. Download the PDF report!

### Monitor Performance
- Check Activity Logs
- View Process status
- Review Test Runs history
- Download PDF reports with screenshots

---

## 📞 Support & Documentation

**Deployment Guides:**
- `DEPLOY_TO_DOKPLOY.md` - Main deployment guide (recommended)
- `QUICK_DEPLOY_GUIDE.md` - Quick reference
- `DOCKPLOY_DEPLOYMENT.md` - Detailed guide with troubleshooting

**Helper Scripts:**
- `deploy.sh` - Automated deployment
- `generate-secrets.js` - Credential generator

**Infrastructure:**
- `SERVER_INFRASTRUCTURE_REFERENCE.md` - Your server setup
- Your Dokploy: http://38.97.60.181:3000
- API Key: Already configured in deploy scripts

---

## 🔧 Troubleshooting

### Common Issues

**DNS not resolving:**
```bash
dig mercan-emploi.com +short
# Should return: 38.97.60.181
```
Wait 30 minutes for DNS propagation.

**SSL certificate error:**
- Check ports 80/443 are open
- Regenerate certificate in Dokploy
- Verify DNS is correct

**Tests failing:**
```bash
# Check Test API is running
curl http://38.97.60.181:3003/api/health

# Check MinIO is running
curl http://38.97.60.181:9002/minio/health/live
```

**View logs:**
```bash
ssh -p 2222 root@38.97.60.181
docker logs qa-dashboard-backend --tail 100
docker logs qa-dashboard-frontend --tail 100
```

See `DEPLOY_TO_DOKPLOY.md` for detailed troubleshooting.

---

## 🎉 Ready to Deploy!

Everything is prepared and waiting for deployment. Choose your method:

**Fastest:** Run `./deploy.sh` then complete in Dokploy UI (15 minutes)

**Step-by-step:** Follow `DEPLOY_TO_DOKPLOY.md` (20 minutes)

**Your call!** Both methods work perfectly with your existing infrastructure.

---

**Questions?** Check the detailed guides or review your `SERVER_INFRASTRUCTURE_REFERENCE.md`

Let's get your QA Dashboard live on **mercan-emploi.com**! 🚀
