# ⚡ Quick Deploy Guide - mercan-emploi.com

**5-Step Quick Reference for Dockploy Deployment**

---

## 🎯 Prerequisites

- ✅ Dockploy installed on 38.97.60.181
- ✅ Access to mercan-emploi.com DNS

---

## Step 1: Generate Credentials (2 minutes)

```bash
cd "/Users/mqxerrormac16/Documents/QA  - Smart System/dashboard"
node generate-secrets.js
```

Copy the output - you'll need it in Step 3.

---

## Step 2: Configure DNS (5 minutes)

Add these DNS records to mercan-emploi.com:

| Type | Name | Value          | TTL  |
|------|------|----------------|------|
| A    | @    | 38.97.60.181   | 3600 |
| A    | www  | 38.97.60.181   | 3600 |

**Check**: `dig mercan-emploi.com +short` should return `38.97.60.181`

---

## Step 3: Deploy in Dockploy (10 minutes)

1. **Login to Dockploy** (http://38.97.60.181:3000 or your Dockploy URL)

2. **Create New Service**
   - Type: **Compose**
   - Name: `qa-dashboard`

3. **Upload Code**
   ```bash
   # On your machine
   cd "/Users/mqxerrormac16/Documents/QA  - Smart System"
   tar -czf qa-dashboard.tar.gz --exclude='node_modules' dashboard/
   scp -P 2222 qa-dashboard.tar.gz root@38.97.60.181:/opt/

   # Then in Dockploy, point to: /opt/dashboard
   ```

4. **Add Environment Variables** (from Step 1)
   ```
   JWT_SECRET=<your-generated-secret>
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=<your-generated-password>
   ```

5. **Configure Domain**
   - Domain: `mercan-emploi.com`
   - HTTPS: ✅ Enabled
   - SSL: Let's Encrypt
   - Port: 3005

6. **Click Deploy** 🚀

---

## Step 4: Verify (2 minutes)

Wait for deployment to complete (~5-10 minutes), then:

```bash
# Check health
curl https://mercan-emploi.com/api/health

# Should return:
{"status":"healthy","dashboard":true,"test_api":true,"database":true}
```

Open browser: **https://mercan-emploi.com**

---

## Step 5: Login & Test (2 minutes)

1. Login with credentials from Step 1
2. Add a test website (e.g., https://google.com)
3. Run a Smoke test
4. Download PDF report

---

## ✅ Done!

Your QA Dashboard is live at **https://mercan-emploi.com**

---

## 🆘 Need Help?

See detailed guide: **DOCKPLOY_DEPLOYMENT.md**

Common issues:
- **Domain not loading**: Wait 30 min for DNS propagation
- **SSL error**: Check port 80/443 are open, verify DNS
- **Login fails**: Double-check environment variables in Dockploy
- **Tests fail**: Ensure Test API (port 3003) is running

---

**Total Time**: ~20 minutes
