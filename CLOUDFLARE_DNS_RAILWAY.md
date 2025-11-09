# Cloudflare DNS Settings for Railway - Step by Step

## DNS Configuration for indicator.pleasecart.net

You need to add a **CNAME record** in Cloudflare to point to your Railway deployment.

## Step 1: Get Railway Domain

### Option A: Use Railway Default Domain

1. **Go to Railway Dashboard:**
   - https://railway.app
   - Login and select your project: **tradingindicator**

2. **Get your Railway domain:**
   - Go to your service → **Settings** → **Networking**
   - You'll see a default Railway domain like:
     - `tradingindicator-production.up.railway.app`
     - Or `your-project.railway.app`

3. **Copy this domain** - you'll need it for the DNS record

### Option B: Add Custom Domain in Railway First

1. **In Railway Dashboard:**
   - Go to your service → **Settings** → **Networking**
   - Click **"Custom Domains"** or **"Add Domain"**
   - Enter: `indicator.pleasecart.net`
   - Railway will show you a CNAME target (e.g., `cname.railway.app`)

2. **Use the CNAME target** Railway provides

## Step 2: Add DNS Record in Cloudflare

### Access Cloudflare DNS

1. **Go to Cloudflare Dashboard:**
   - https://dash.cloudflare.com
   - Login to your account

2. **Select your domain:**
   - Click on **pleasecart.net**

3. **Go to DNS Settings:**
   - Click **"DNS"** in the left sidebar
   - Click **"Records"** tab
   - You'll see your existing DNS records

### Add CNAME Record

1. **Click "Add record"** button (usually top-right)

2. **Fill in the form:**

   ```
   Type:        CNAME
   Name:        indicator
   Target:      (paste Railway domain here)
   Proxy:       DNS only (gray cloud) ← IMPORTANT!
   TTL:         Auto
   ```

3. **Details:**
   - **Type:** Select **"CNAME"** from dropdown
   - **Name:** Type `indicator` (this creates indicator.pleasecart.net)
   - **Target:** Paste your Railway domain
     - Example: `tradingindicator-production.up.railway.app`
     - Or Railway's CNAME target if you added custom domain
   - **Proxy status:** 
     - **Click the toggle OFF** to set to **"DNS only"** (gray cloud icon)
     - ⚠️ **IMPORTANT:** Use "DNS only" (not "Proxied") for Railway
     - This allows Railway to handle SSL automatically
   - **TTL:** Leave as **"Auto"**

4. **Click "Save"**

## Visual Guide

```
Cloudflare DNS Record Form:
┌─────────────────────────────────────┐
│ Type:        [CNAME ▼]              │
│ Name:        indicator               │
│ Target:      your-project.railway.app │
│ Proxy:       [●] DNS only  [ ] Proxied│
│ TTL:         Auto                    │
│              [Save]                  │
└─────────────────────────────────────┐
```

## Important Settings

### ✅ Use "DNS only" (Gray Cloud)

**Why:**
- Direct connection to Railway
- Railway handles SSL certificates automatically
- Simpler setup
- Recommended for Railway deployments

**How:**
- Toggle should be **OFF** (gray cloud icon)
- Text should say **"DNS only"**

### ❌ Don't Use "Proxied" (Orange Cloud)

**Why not:**
- Can interfere with Railway's SSL
- More complex SSL configuration needed
- May cause routing issues

## Step 3: Wait for Propagation

### DNS Propagation
- **Cloudflare DNS:** Usually < 1 minute (very fast!)
- **Global propagation:** 1-5 minutes

### SSL Certificate
- **Railway auto-provisions SSL:** 1-5 minutes after DNS is configured
- Check Railway dashboard for SSL status

## Step 4: Verify It's Working

### Check DNS

1. **In Cloudflare:**
   - Go to DNS → Records
   - You should see your CNAME record for `indicator`

2. **Test DNS resolution:**
   ```powershell
   nslookup indicator.pleasecart.net
   ```
   Should show Railway's IP or CNAME target

### Check Railway

1. **In Railway Dashboard:**
   - Go to Settings → Networking
   - Check custom domain status
   - Should show SSL certificate status

2. **Test the site:**
   - Visit: `https://indicator.pleasecart.net`
   - Should load your app (may take a few minutes)

## Complete Example

### Railway Domain:
```
tradingindicator-production.up.railway.app
```

### Cloudflare DNS Record:
```
Type:    CNAME
Name:    indicator
Target:  tradingindicator-production.up.railway.app
Proxy:   DNS only (gray cloud)
TTL:     Auto
```

### Result:
- `indicator.pleasecart.net` → `tradingindicator-production.up.railway.app`
- SSL: Automatic (Railway)
- Status: ✅ Live

## Troubleshooting

### Domain Not Resolving

1. **Check DNS record:**
   - Verify CNAME exists in Cloudflare
   - Check target is correct (no typos)
   - Wait 1-2 minutes for propagation

2. **Check Railway:**
   - Verify deployment is live
   - Check Railway domain works: `https://your-project.railway.app`
   - Verify custom domain is added in Railway

3. **Test DNS:**
   ```powershell
   nslookup indicator.pleasecart.net
   ```

### SSL Certificate Issues

1. **If using DNS only (correct):**
   - Railway automatically provisions SSL
   - Wait 5-10 minutes after DNS is configured
   - Check Railway dashboard for SSL status

2. **If using Proxied (wrong):**
   - Switch to "DNS only" (gray cloud)
   - Wait and try again

### "502 Bad Gateway" or "Connection Refused"

1. **Check Railway deployment:**
   - Ensure app is deployed and running
   - Check Railway logs for errors
   - Verify build was successful

2. **Check DNS target:**
   - Ensure CNAME target matches Railway's domain exactly
   - No trailing slashes or extra characters

## Quick Checklist

Before saving DNS record, verify:
- [ ] Type is **CNAME** (not A)
- [ ] Name is **indicator** (not @)
- [ ] Target is Railway domain (correct, no typos)
- [ ] Proxy is **DNS only** (gray cloud, not orange)
- [ ] TTL is **Auto**

## Summary

**What you need:**
1. Railway domain (from Railway dashboard)
2. Cloudflare DNS access (for pleasecart.net)

**What to add:**
- Type: CNAME
- Name: indicator
- Target: (Railway domain)
- Proxy: DNS only (gray cloud)

**Result:**
- `indicator.pleasecart.net` → Your Railway app
- SSL: Automatic
- Live in ~5 minutes

## Need Help?

- **Cloudflare Support:** https://support.cloudflare.com
- **Railway Docs:** https://docs.railway.app
- **Check DNS:** https://dnschecker.org (global DNS propagation)

