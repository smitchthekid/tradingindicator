# Railway Custom Domain Setup - Complete Guide

## Current Issue

Railway shows "Not Found" error because the custom domain `indicator.pleasecart.net` hasn't been added in Railway yet.

## Solution: Add Custom Domain in Railway First

### Step 1: Add Custom Domain in Railway

1. **Go to Railway Dashboard:**
   - https://railway.app
   - Login to your account

2. **Select your project:**
   - Click on **"tradingindicator"** project

3. **Select your service:**
   - Click on your service (the one that's deployed)

4. **Go to Settings:**
   - Click **"Settings"** tab
   - Or look for gear icon

5. **Go to Networking:**
   - Click **"Networking"** or **"Domains"** section
   - Scroll down if needed

6. **Add Custom Domain:**
   - Look for **"Custom Domains"** section
   - Click **"Add Domain"** or **"Custom Domain"** button
   - Enter: `indicator.pleasecart.net`
   - Click **"Add"** or **"Save"**

7. **Railway will show DNS instructions:**
   - Railway will display what DNS record to add
   - It might show a CNAME target
   - Or it might just say to add a CNAME pointing to Railway

### Step 2: Configure DNS in Cloudflare

After adding the domain in Railway, configure DNS:

1. **Go to Cloudflare:**
   - https://dash.cloudflare.com
   - Select domain: **pleasecart.net**
   - DNS → Records

2. **Add/Edit CNAME Record:**
   - **Type:** CNAME
   - **Name:** `indicator`
   - **Target:** `tradingindicator-production.up.railway.app`
     - Or use the CNAME target Railway provides (if different)
   - **Proxy:** DNS only (gray cloud) ← CRITICAL!
   - **TTL:** Auto
   - **Save**

### Step 3: Wait for Provisioning

1. **DNS Propagation:**
   - Cloudflare: < 1 minute
   - Global: 1-5 minutes

2. **Railway Domain Provisioning:**
   - Railway needs to detect the DNS record
   - Usually takes 5-10 minutes
   - Check Railway dashboard for status

3. **SSL Certificate:**
   - Railway auto-provisions SSL
   - Takes 5-10 minutes after DNS is configured

## Step-by-Step: Railway Custom Domain

### In Railway Dashboard:

```
Railway Dashboard
├─ Your Project (tradingindicator)
│  └─ Your Service
│     └─ Settings
│        └─ Networking
│             └─ Custom Domains
│                └─ [Add Domain] ← Click here
│                   └─ Enter: indicator.pleasecart.net
```

### What Railway Will Show:

After adding the domain, Railway will:
- Show DNS instructions
- Display domain status (pending/provisioning/active)
- Show SSL certificate status

## Complete Setup Process

### 1. Add Domain in Railway (Do This First!)

**Railway → Project → Service → Settings → Networking → Custom Domains → Add Domain**

Enter: `indicator.pleasecart.net`

### 2. Configure DNS in Cloudflare

**Cloudflare → pleasecart.net → DNS → Records → Add Record**

```
Type:    CNAME
Name:    indicator
Target:  tradingindicator-production.up.railway.app
Proxy:   DNS only (gray cloud)
TTL:     Auto
```

### 3. Wait for Provisioning

- **5-10 minutes** for Railway to detect DNS
- **5-10 minutes** for SSL certificate
- **Total: ~10-15 minutes**

### 4. Verify

- Check Railway dashboard - domain should show as "Active"
- Visit: `https://indicator.pleasecart.net`
- Should load your app!

## Troubleshooting

### Railway Still Shows "Not Found"

1. **Check domain is added in Railway:**
   - Go to Railway → Settings → Networking
   - Verify `indicator.pleasecart.net` is listed
   - Check status (should be "Active" or "Provisioning")

2. **Check DNS is configured:**
   - Cloudflare → DNS → Records
   - Verify CNAME for `indicator` exists
   - Verify Target is correct
   - Verify Proxy is "DNS only" (gray cloud)

3. **Wait longer:**
   - Railway provisioning can take 10-15 minutes
   - DNS propagation can take up to 5 minutes
   - SSL can take up to 10 minutes

4. **Check Railway logs:**
   - Railway dashboard → Your service → Logs
   - Look for domain-related errors

### Domain Status in Railway

Railway will show domain status:
- **Pending:** DNS not configured yet
- **Provisioning:** DNS detected, setting up
- **Active:** Domain is ready and working
- **Failed:** Check DNS configuration

### DNS Not Detected by Railway

1. **Verify DNS record:**
   - Check Cloudflare DNS record exists
   - Verify Target is correct
   - Verify Proxy is "DNS only"

2. **Test DNS resolution:**
   ```powershell
   nslookup indicator.pleasecart.net
   ```
   Should show Railway's IP or CNAME target

3. **Wait longer:**
   - Railway can take 10-15 minutes to detect DNS
   - Be patient!

## Important Notes

### Order Matters!

1. **First:** Add domain in Railway
2. **Then:** Configure DNS in Cloudflare
3. **Finally:** Wait for provisioning

### Proxy Setting is Critical!

- **Must be:** DNS only (gray cloud)
- **NOT:** Proxied (orange cloud)
- Railway needs direct connection for SSL provisioning

## Quick Checklist

- [ ] Domain added in Railway (Settings → Networking → Custom Domains)
- [ ] DNS record added in Cloudflare (CNAME for `indicator`)
- [ ] DNS Target: `tradingindicator-production.up.railway.app`
- [ ] DNS Proxy: DNS only (gray cloud)
- [ ] Waited 10-15 minutes for provisioning
- [ ] Checked Railway dashboard for domain status
- [ ] Tested: `https://indicator.pleasecart.net`

## Summary

**The issue:** Railway doesn't know about your custom domain yet.

**The fix:**
1. Add `indicator.pleasecart.net` in Railway (Settings → Networking → Custom Domains)
2. Configure DNS in Cloudflare (CNAME pointing to Railway)
3. Wait 10-15 minutes for Railway to provision the domain
4. Test: `https://indicator.pleasecart.net`

**Most important:** Add the domain in Railway FIRST, then configure DNS in Cloudflare!

