# Force SSL/HTTPS - Complete Guide

## Overview

To force SSL (HTTPS) for your Railway app, you have multiple options:
1. **Railway automatically provides SSL** for custom domains
2. **Cloudflare can enforce HTTPS** (if using Cloudflare)
3. **App-level redirects** (HTTP → HTTPS)

## Option 1: Railway SSL (Automatic)

Railway **automatically provisions SSL certificates** for custom domains.

### How It Works

1. **Add custom domain in Railway:**
   - Railway → Settings → Networking → Custom Domains
   - Add: `indicator.pleasecart.net`

2. **Configure DNS in Cloudflare:**
   - CNAME pointing to Railway
   - **Proxy: DNS only** (gray cloud) - important!

3. **Railway auto-provisions SSL:**
   - Takes 5-10 minutes after DNS is configured
   - SSL certificate is automatically created
   - HTTPS is enabled automatically

### Check SSL Status

1. **In Railway Dashboard:**
   - Settings → Networking → Custom Domains
   - Check SSL certificate status
   - Should show "Active" or "Provisioned"

2. **Test:**
   - Visit: `https://indicator.pleasecart.net`
   - Should show secure connection (lock icon)

## Option 2: Cloudflare SSL Settings

If using Cloudflare (which you are), you can enforce HTTPS:

### Step 1: Enable SSL/TLS

1. **Go to Cloudflare:**
   - https://dash.cloudflare.com
   - Select domain: **pleasecart.net**

2. **Go to SSL/TLS:**
   - Click **"SSL/TLS"** in left sidebar
   - Click **"Overview"** tab

3. **Set SSL mode:**
   - Choose **"Full"** or **"Full (strict)"**
   - This ensures HTTPS is used

### Step 2: Enable Always Use HTTPS

1. **Go to SSL/TLS:**
   - Click **"Edge Certificates"** tab

2. **Enable "Always Use HTTPS":**
   - Toggle **"Always Use HTTPS"** to ON
   - This redirects HTTP → HTTPS automatically

3. **Enable "Automatic HTTPS Rewrites":**
   - Toggle **"Automatic HTTPS Rewrites"** to ON
   - Rewrites HTTP links to HTTPS

### Step 3: HTTP Strict Transport Security (HSTS)

1. **Go to SSL/TLS:**
   - Click **"Edge Certificates"** tab
   - Scroll to **"HTTP Strict Transport Security (HSTS)"**

2. **Enable HSTS:**
   - Click **"Enable HSTS"**
   - Set max age (recommended: 31536000 = 1 year)
   - Enable "Include Subdomains"
   - Enable "Preload"
   - Click **"Save"**

## Option 3: App-Level Redirect (Code)

You can also add HTTP → HTTPS redirect in your app code:

### For Static Sites (Vite/React)

Create a redirect in your build or server configuration.

### Using Railway's serve (Current Setup)

Your `package.json` uses `serve` to serve the static site. You can configure it:

**Update `package.json`:**
```json
{
  "scripts": {
    "start": "serve -s dist -l ${PORT:-3000} --single"
  }
}
```

However, Railway and Cloudflare handle SSL, so app-level redirects are usually not needed.

## Recommended Setup

### For Railway + Cloudflare:

1. **Railway:**
   - Add custom domain
   - Railway auto-provisions SSL
   - SSL is automatic

2. **Cloudflare:**
   - Set SSL mode: **Full** or **Full (strict)**
   - Enable **"Always Use HTTPS"**
   - Enable **HSTS** (optional but recommended)

3. **Result:**
   - All HTTP requests → HTTPS
   - SSL certificates valid
   - Secure connections enforced

## Step-by-Step: Cloudflare SSL Configuration

### 1. Set SSL Mode

1. Cloudflare → pleasecart.net → **SSL/TLS** → **Overview**
2. Select: **"Full"** or **"Full (strict)"**
3. **Full (strict)** is more secure (validates Railway's certificate)

### 2. Enable Always Use HTTPS

1. Cloudflare → **SSL/TLS** → **Edge Certificates**
2. Toggle **"Always Use HTTPS"** to **ON**
3. This redirects all HTTP → HTTPS automatically

### 3. Enable HSTS (Optional but Recommended)

1. Cloudflare → **SSL/TLS** → **Edge Certificates**
2. Scroll to **"HTTP Strict Transport Security (HSTS)"**
3. Click **"Enable HSTS"**
4. Configure:
   - Max Age: `31536000` (1 year)
   - Include Subdomains: **Yes**
   - Preload: **Yes** (optional)
5. Click **"Save"**

## Verification

### Test HTTPS

1. **Visit HTTP (should redirect):**
   - `http://indicator.pleasecart.net`
   - Should automatically redirect to HTTPS

2. **Visit HTTPS:**
   - `https://indicator.pleasecart.net`
   - Should load with secure connection
   - Browser should show lock icon

3. **Check SSL certificate:**
   - Click lock icon in browser
   - Should show valid certificate
   - Issued by Railway or Cloudflare

## Troubleshooting

### SSL Not Working

1. **Check Railway SSL status:**
   - Railway dashboard → Settings → Networking
   - Verify SSL certificate is provisioned
   - Wait 10-15 minutes if just added domain

2. **Check Cloudflare SSL mode:**
   - Should be "Full" or "Full (strict)"
   - NOT "Flexible" (won't work with Railway)

3. **Check DNS:**
   - Proxy must be "DNS only" (gray cloud)
   - NOT "Proxied" (orange cloud) - can cause SSL issues

### HTTP Not Redirecting to HTTPS

1. **Enable "Always Use HTTPS" in Cloudflare:**
   - SSL/TLS → Edge Certificates
   - Toggle "Always Use HTTPS" to ON

2. **Wait a few minutes:**
   - Changes can take 1-2 minutes to propagate

### SSL Certificate Errors

1. **Check Railway SSL:**
   - Make sure Railway has provisioned SSL
   - Check Railway dashboard for SSL status

2. **Check Cloudflare SSL mode:**
   - Use "Full" or "Full (strict)"
   - "Flexible" won't work properly

## Quick Setup Checklist

- [ ] Custom domain added in Railway
- [ ] DNS configured in Cloudflare (CNAME, DNS only)
- [ ] Railway SSL provisioned (check Railway dashboard)
- [ ] Cloudflare SSL mode: Full or Full (strict)
- [ ] "Always Use HTTPS" enabled in Cloudflare
- [ ] HSTS enabled (optional but recommended)
- [ ] Test: HTTP redirects to HTTPS
- [ ] Test: HTTPS works with valid certificate

## Summary

**Best approach for Railway + Cloudflare:**

1. **Railway:** Auto-provisions SSL (automatic)
2. **Cloudflare:** 
   - SSL mode: **Full (strict)**
   - Enable **"Always Use HTTPS"**
   - Enable **HSTS** (optional)

**Result:**
- All HTTP → HTTPS redirects
- SSL certificates valid
- Secure connections enforced
- No code changes needed!

## Important Notes

- **Railway handles SSL automatically** for custom domains
- **Cloudflare can enforce HTTPS** with "Always Use HTTPS"
- **No app code changes needed** - handled by infrastructure
- **DNS must be "DNS only"** (gray cloud) for Railway SSL to work

Your app will automatically use HTTPS once configured!

