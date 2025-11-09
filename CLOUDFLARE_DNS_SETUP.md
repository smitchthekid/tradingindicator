# Cloudflare DNS Configuration for indicator.pleasecart.net

## Step-by-Step Guide

### Step 1: Get Railway Domain Information

1. **Deploy your app to Railway:**
   - Go to https://railway.com
   - Create project and deploy your GitHub repository
   - Wait for deployment to complete

2. **Get Railway domain:**
   - In Railway dashboard, go to your service
   - Click on **Settings** → **Networking**
   - You'll see a default Railway domain (e.g., `your-project.railway.app`)
   - Or add custom domain: `indicator.pleasecart.net`
   - Railway will show you the DNS target (CNAME value)

### Step 2: Configure DNS in Cloudflare

1. **Login to Cloudflare:**
   - Go to https://dash.cloudflare.com
   - Login to your account
   - Select your domain: **pleasecart.net**

2. **Go to DNS Settings:**
   - Click **DNS** in the left sidebar
   - Click **Records** tab
   - You'll see your existing DNS records

3. **Add CNAME Record:**
   - Click **"Add record"** button
   - Configure as follows:
     - **Type:** Select **CNAME** from dropdown
     - **Name:** `indicator` (this creates indicator.pleasecart.net)
     - **Target:** Paste the Railway CNAME target (from Step 1)
       - Example: `your-project.railway.app`
       - Or Railway will provide a specific target for custom domains
     - **Proxy status:** Choose one:
       - **DNS only** (gray cloud icon) - Recommended for Railway
         - Direct connection to Railway
         - Railway handles SSL
       - **Proxied** (orange cloud icon) - Alternative
         - Traffic goes through Cloudflare CDN first
         - Cloudflare handles SSL
         - May cause issues with Railway's SSL
     - **TTL:** Auto (default)
   - Click **"Save"**

### Step 3: Wait for DNS Propagation

- **Cloudflare DNS:** Usually propagates in **< 1 minute**
- **SSL Certificate:** Railway will automatically provision SSL
  - Usually takes **1-5 minutes** after DNS is configured
  - Check Railway dashboard for SSL status

### Step 4: Verify It's Working

1. **Check DNS:**
   ```bash
   # In command prompt or PowerShell
   nslookup indicator.pleasecart.net
   ```
   Should show Railway's IP or CNAME target

2. **Check in browser:**
   - Visit: `https://indicator.pleasecart.net`
   - Should load your app (may take a few minutes for SSL)

## Visual Guide

### Cloudflare DNS Record Configuration:

```
┌─────────────────────────────────────────┐
│ Add Record                              │
├─────────────────────────────────────────┤
│ Type:        [CNAME ▼]                  │
│ Name:        indicator                   │
│ Target:      your-project.railway.app   │
│ Proxy:       [DNS only] [Proxied]      │
│ TTL:         Auto                       │
│                                          │
│              [Save]                      │
└─────────────────────────────────────────┘
```

## Proxy Status Options

### DNS Only (Gray Cloud) - Recommended ✅

**Pros:**
- Direct connection to Railway
- Railway's SSL certificate works properly
- Simpler setup
- Better for Railway deployments

**Cons:**
- No Cloudflare CDN caching
- No Cloudflare DDoS protection

**When to use:** Always for Railway deployments

### Proxied (Orange Cloud)

**Pros:**
- Cloudflare CDN caching (faster for static assets)
- Cloudflare DDoS protection
- Cloudflare analytics

**Cons:**
- May interfere with Railway's SSL
- More complex SSL setup
- Can cause routing issues

**When to use:** Only if you need Cloudflare's CDN features and are willing to configure SSL properly

## Railway-Specific Instructions

### If Railway Provides Custom Domain Target:

1. In Railway → Settings → Networking
2. Add custom domain: `indicator.pleasecart.net`
3. Railway will show you a CNAME target (e.g., `cname.railway.app`)
4. Use that exact target in Cloudflare DNS

### If Using Railway Default Domain:

1. Railway gives you: `your-project.railway.app`
2. In Cloudflare, create CNAME:
   - Name: `indicator`
   - Target: `your-project.railway.app`
   - Proxy: DNS only

## Troubleshooting

### Domain Not Resolving

1. **Check DNS record:**
   - Verify CNAME record exists in Cloudflare
   - Check target is correct
   - Wait 1-2 minutes for propagation

2. **Check Railway:**
   - Verify deployment is live
   - Check Railway domain works: `https://your-project.railway.app`
   - Verify custom domain is added in Railway settings

3. **Test DNS:**
   ```bash
   nslookup indicator.pleasecart.net
   dig indicator.pleasecart.net
   ```

### SSL Certificate Issues

1. **If using DNS only (gray cloud):**
   - Railway automatically provisions SSL
   - Wait 5-10 minutes after DNS is configured
   - Check Railway dashboard for SSL status

2. **If using Proxied (orange cloud):**
   - Cloudflare provides SSL automatically
   - May need to configure SSL mode in Cloudflare
   - Go to SSL/TLS → Overview → Set to "Full" or "Full (strict)"

### "502 Bad Gateway" or "Connection Refused"

1. **Check Railway deployment:**
   - Ensure app is deployed and running
   - Check Railway logs for errors
   - Verify build was successful

2. **Check DNS target:**
   - Ensure CNAME target matches Railway's domain exactly
   - No trailing slashes or extra characters

3. **Try disabling proxy:**
   - Switch to "DNS only" (gray cloud) if using "Proxied"
   - Wait 1-2 minutes and try again

## Quick Reference

### Cloudflare DNS Record:
- **Type:** CNAME
- **Name:** indicator
- **Target:** (Railway domain or CNAME target)
- **Proxy:** DNS only (recommended)
- **TTL:** Auto

### Railway Settings:
- Add custom domain in Railway → Settings → Networking
- Railway will show DNS instructions
- SSL is automatic (with DNS only proxy)

### Expected Timeline:
- DNS propagation: < 1 minute (Cloudflare)
- SSL certificate: 1-5 minutes (Railway)
- Total setup time: ~5 minutes

## Example Configuration

**Railway Domain:** `trading-indicator-production.up.railway.app`

**Cloudflare DNS Record:**
```
Type:    CNAME
Name:    indicator
Target:  trading-indicator-production.up.railway.app
Proxy:   DNS only (gray cloud)
TTL:     Auto
```

**Result:**
- `indicator.pleasecart.net` → `trading-indicator-production.up.railway.app`
- SSL: Automatic (Railway)
- Status: ✅ Live

## Need Help?

- **Cloudflare Support:** https://support.cloudflare.com
- **Railway Docs:** https://docs.railway.app
- **Check DNS:** https://dnschecker.org (check global DNS propagation)

