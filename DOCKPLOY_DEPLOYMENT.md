# 🚀 Deploy QA Dashboard to mercan-emploi.com using Dockploy

Complete guide to deploy the QA Dashboard on your domain using Dockploy.

---

## Prerequisites

✅ Dockploy installed on server at 38.97.60.181
✅ Access to mercan-emploi.com DNS settings
✅ Docker and Docker Compose installed
✅ Port 80 and 443 available

---

## Step 1: Prepare Environment Variables

Before deploying, you need to set secure credentials.

### Generate a Secure JWT Secret

```bash
# On your local machine, generate a random secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy the output - you'll use it as `JWT_SECRET`.

### Set Admin Password

Choose a strong password for the admin account (minimum 12 characters, mix of letters, numbers, symbols).

---

## Step 2: Access Dockploy

1. Open Dockploy in your browser (usually at http://38.97.60.181:3000 or your Dockploy URL)
2. Log in to your Dockploy account

---

## Step 3: Create New Application

1. Click **"Create New Service"** or **"New Application"**
2. Select **"Compose"** (Docker Compose)
3. Name: `qa-dashboard`
4. Description: `QA Testing Dashboard for mercan-emploi.com`

---

## Step 4: Configure Git Repository (Option A - Recommended)

If your code is in a Git repository:

1. **Repository URL**: Enter your Git repository URL
2. **Branch**: `main` or your production branch
3. **Auto Deploy**: Enable for automatic deployments on push

**OR** Use Option B if deploying from local files.

---

## Step 4B: Upload Files (Option B)

If deploying from local machine:

```bash
cd "/Users/mqxerrormac16/Documents/QA  - Smart System"

# Create deployment archive (excluding node_modules)
tar -czf qa-dashboard.tar.gz \
  --exclude='node_modules' \
  --exclude='dist' \
  --exclude='.git' \
  --exclude='backend/database' \
  --exclude='backend/screenshots' \
  --exclude='backend/reports' \
  dashboard/

# Upload to server
scp -P 2222 qa-dashboard.tar.gz root@38.97.60.181:/opt/

# SSH to server and extract
ssh -p 2222 root@38.97.60.181
cd /opt
tar -xzf qa-dashboard.tar.gz
```

Then in Dockploy, point to `/opt/dashboard` as the source directory.

---

## Step 5: Configure Docker Compose

1. In Dockploy, select **"Use docker-compose.yml"**
2. Dockploy will automatically detect `/opt/dashboard/docker-compose.yml`
3. Verify the compose file is loaded correctly

---

## Step 6: Set Environment Variables

In Dockploy's Environment Variables section, add:

```env
JWT_SECRET=<paste-your-generated-secret-here>
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<your-strong-password-here>
```

**Important Security Notes:**
- Replace `<paste-your-generated-secret-here>` with the secret from Step 1
- Replace `<your-strong-password-here>` with your chosen admin password
- Never commit these values to Git
- Store them securely (password manager recommended)

---

## Step 7: Configure Domain in Dockploy

1. Go to **Domains** section in your application
2. Click **"Add Domain"**
3. Enter: `mercan-emploi.com`
4. **Enable HTTPS**: ✅ Yes
5. **SSL Certificate**: Select **"Let's Encrypt"**
6. **Auto-renew**: ✅ Enabled
7. **Port**: 3005 (this is the frontend port)
8. Click **"Add Domain"**

Dockploy will automatically:
- Configure nginx reverse proxy
- Generate SSL certificate via Let's Encrypt
- Set up automatic certificate renewal
- Handle HTTP to HTTPS redirect

---

## Step 8: Configure DNS

Point your domain to the server:

1. Log in to your domain registrar (where you bought mercan-emploi.com)
2. Go to DNS settings
3. Add/Update these records:

```
Type: A
Name: @
Value: 38.97.60.181
TTL: 3600

Type: A
Name: www
Value: 38.97.60.181
TTL: 3600
```

**DNS Propagation**: May take 5 minutes to 48 hours (usually ~30 minutes)

**Check DNS Propagation**:
```bash
# Check if DNS is updated
dig mercan-emploi.com +short
# Should return: 38.97.60.181

# Or use online tool
# https://dnschecker.org/#A/mercan-emploi.com
```

---

## Step 9: Deploy Application

1. In Dockploy, click **"Deploy"** or **"Start"**
2. Dockploy will:
   - Pull the code (if using Git)
   - Build Docker images
   - Start containers
   - Configure nginx
   - Generate SSL certificate

**Build Time**: ~5-10 minutes

---

## Step 10: Monitor Deployment

1. Watch the deployment logs in Dockploy
2. Look for these success messages:

```
✅ Database initialized with TypeScript
✅ WebSocket server initialized
✅ QA Dashboard Backend running on port 3004
✅ Admin credentials initialized
✅ Nginx configured
✅ SSL certificate generated
```

---

## Step 11: Verify Deployment

### Check Backend Health

```bash
curl https://mercan-emploi.com/api/health
```

**Expected Response**:
```json
{
  "status": "healthy",
  "dashboard": true,
  "test_api": true,
  "database": true
}
```

### Check Frontend

Open in browser:
```
https://mercan-emploi.com
```

You should see the QA Dashboard login page.

---

## Step 12: First Login

1. Navigate to `https://mercan-emploi.com`
2. Username: `admin` (or your custom username)
3. Password: `<the password you set in Step 6>`
4. Click **"Login"**

✅ You should be redirected to the dashboard home page.

---

## Step 13: Add First Website for Testing

1. Click **"Websites"** → **"Add Website"**
2. Name: `Test Site`
3. URL: `https://google.com`
4. Test Frequency: `Manual`
5. Click **"Add Website"**

---

## Step 14: Run First Test

1. Click **▶️ Smoke** button next to your test website
2. Wait 10-30 seconds
3. Go to **"Test Runs"** page
4. Click the latest run to see results
5. Try downloading a PDF report

---

## ✅ Deployment Success Checklist

- [ ] Dashboard accessible at https://mercan-emploi.com
- [ ] HTTPS/SSL working (green lock icon in browser)
- [ ] Login works with your credentials
- [ ] Can create websites
- [ ] Can run tests (Smoke, Performance, Accessibility, etc.)
- [ ] Test results display correctly
- [ ] PDF reports download successfully
- [ ] Screenshots visible in Visual Regression tests
- [ ] WebSocket real-time updates working
- [ ] Activity Logs showing events
- [ ] Processes page showing test runs

---

## 🔧 Troubleshooting

### Domain not loading

**Check DNS**:
```bash
dig mercan-emploi.com +short
# Should return: 38.97.60.181
```

Wait 30-60 minutes for DNS propagation if just updated.

### SSL Certificate Error

1. Check Dockploy logs for Let's Encrypt errors
2. Ensure port 80 and 443 are open on firewall
3. Verify DNS is pointing to correct IP
4. Try regenerating certificate in Dockploy

### Backend not responding

**Check container status**:
```bash
ssh -p 2222 root@38.97.60.181
docker ps | grep qa-dashboard
docker logs qa-dashboard-backend
```

**Check health**:
```bash
docker exec qa-dashboard-backend wget -q -O- http://localhost:3004/api/health
```

### Tests failing

1. Verify Test API is running on port 3003:
   ```bash
   curl http://38.97.60.181:3003/api/health
   ```

2. Check MinIO is accessible on port 9002:
   ```bash
   curl http://38.97.60.181:9002/minio/health/live
   ```

### WebSocket connection issues

1. Check Dockploy proxy configuration includes WebSocket support
2. Verify `/socket.io` endpoint is proxied correctly
3. Check browser console for connection errors

---

## 🔄 Updating the Application

When you make changes to the code:

### If using Git:

1. Push changes to your repository
2. In Dockploy, click **"Redeploy"** or **"Rebuild"**
3. Dockploy will pull latest code and rebuild

### If using local files:

```bash
# Local machine
cd "/Users/mqxerrormac16/Documents/QA  - Smart System"
tar -czf qa-dashboard.tar.gz \
  --exclude='node_modules' \
  --exclude='dist' \
  --exclude='.git' \
  dashboard/

scp -P 2222 qa-dashboard.tar.gz root@38.97.60.181:/opt/

# Server
ssh -p 2222 root@38.97.60.181
cd /opt
tar -xzf qa-dashboard.tar.gz
```

Then in Dockploy, click **"Redeploy"**.

---

## 📊 Monitoring

### View Logs

In Dockploy:
1. Go to your application
2. Click **"Logs"** tab
3. Select container: `dashboard-backend` or `dashboard-frontend`

### Check Resource Usage

```bash
ssh -p 2222 root@38.97.60.181
docker stats qa-dashboard-backend qa-dashboard-frontend
```

### Database Backup

```bash
ssh -p 2222 root@38.97.60.181

# Find the volume
docker volume ls | grep qa-database

# Backup database
docker run --rm \
  -v qa_qa-database:/data \
  -v $(pwd):/backup \
  alpine \
  tar -czf /backup/qa-database-backup-$(date +%Y%m%d).tar.gz -C /data .
```

---

## 🔒 Security Recommendations

1. **Change Default Credentials**: Done in Step 6 ✅
2. **Use Strong JWT Secret**: Done in Step 6 ✅
3. **Enable Firewall**: Only allow ports 22 (SSH), 80 (HTTP), 443 (HTTPS)
4. **Regular Updates**: Keep Docker, Dockploy, and application updated
5. **Backup Database**: Schedule regular backups
6. **Monitor Logs**: Check for suspicious activity
7. **Rate Limiting**: Already configured in the app
8. **CORS**: Already configured for mercan-emploi.com only

---

## 📝 Support

If you encounter issues:

1. Check Dockploy logs
2. Check container logs: `docker logs qa-dashboard-backend`
3. Verify environment variables are set correctly
4. Ensure Test API (port 3003) and MinIO (port 9002) are running
5. Check DNS propagation
6. Verify SSL certificate status in Dockploy

---

## 🎉 Success!

Your QA Dashboard is now live at:

**🌐 https://mercan-emploi.com**

You can now:
- Manage multiple websites
- Run automated tests (Smoke, Performance, Accessibility, Security, SEO, Visual Regression)
- Download detailed PDF reports
- Monitor test history and trends
- Schedule automated testing
- View real-time test progress

**Deployment Time**: ~15-20 minutes (including DNS propagation)

Enjoy your production QA Dashboard! 🚀
