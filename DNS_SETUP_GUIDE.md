# DNS Setup Guide for indicator.pleasecart.net

## Which Platform Are You Using?

Choose your deployment platform to see specific DNS instructions:

### Option 1: Cloudflare Pages (Recommended for Cloudflare domains) ⭐

**Best choice if:** Your domain is on Cloudflare (which it is!)

**DNS Setup:**
- **Automatic!** Cloudflare Pages handles DNS automatically
- Just add the domain in Cloudflare Pages dashboard
- No manual DNS configuration needed

**Steps:**
1. Deploy to Cloudflare Pages
2. Add custom domain: `indicator.pleasecart.net`
3. Cloudflare auto-configures DNS
4. Done!

---

### Option 2: Vercel

**DNS Setup:**
1. Deploy to Vercel
2. In Vercel → Project Settings → Domains
3. Add: `indicator.pleasecart.net`
4. Vercel shows you a CNAME target (e.g., `cname.vercel-dns.com`)

**In Cloudflare:**
- Type: **CNAME**
- Name: `indicator`
- Target: (paste Vercel's CNAME target)
- Proxy: **DNS only** (gray cloud)
- Save

---

### Option 3: Netlify

**DNS Setup:**
1. Deploy to Netlify
2. In Netlify → Site Settings → Domain Management
3. Add: `indicator.pleasecart.net`
4. Netlify shows you a CNAME target

**In Cloudflare:**
- Type: **CNAME**
- Name: `indicator`
- Target: (paste Netlify's CNAME target)
- Proxy: **DNS only** (gray cloud)
- Save

---

### Option 4: Railway

**DNS Setup:**
1. Deploy to Railway
2. In Railway → Settings → Networking
3. Add custom domain: `indicator.pleasecart.net`
4. Railway shows you a CNAME target

**In Cloudflare:**
- Type: **CNAME**
- Name: `indicator`
- Target: (paste Railway's CNAME target)
- Proxy: **DNS only** (gray cloud)
- Save

---

## General Cloudflare DNS Configuration

Regardless of which platform you use, here's how to add the DNS record in Cloudflare:

### Step 1: Login to Cloudflare
- Go to: https://dash.cloudflare.com
- Login and select your domain: **pleasecart.net**

### Step 2: Add DNS Record
1. Click **DNS** in left sidebar
2. Click **Records** tab
3. Click **"Add record"** button

### Step 3: Configure CNAME Record
```
Type:        CNAME
Name:        indicator
Target:      (paste your platform's CNAME target)
Proxy:       DNS only (gray cloud) - Recommended
TTL:         Auto
```

### Step 4: Save
- Click **"Save"**
- DNS propagates in < 1 minute

---

## How to Find Your Platform's CNAME Target

### If Using Vercel:
1. Vercel Dashboard → Your Project
2. Settings → Domains
3. Add domain: `indicator.pleasecart.net`
4. Copy the CNAME target shown

### If Using Netlify:
1. Netlify Dashboard → Your Site
2. Site Settings → Domain Management
3. Add custom domain: `indicator.pleasecart.net`
4. Copy the CNAME target shown

### If Using Railway:
1. Railway Dashboard → Your Service
2. Settings → Networking
3. Add custom domain: `indicator.pleasecart.net`
4. Copy the CNAME target shown

### If Using Cloudflare Pages:
- No CNAME needed! Just add domain in Pages dashboard
- Cloudflare handles everything automatically

---

## Quick Decision Guide

**Use Cloudflare Pages if:**
- ✅ Your domain is on Cloudflare (it is!)
- ✅ You want the easiest setup
- ✅ You want free hosting
- ✅ You want automatic DNS configuration

**Use Vercel if:**
- ✅ You prefer Vercel's developer experience
- ✅ You want preview deployments
- ✅ You're already using Vercel

**Use Netlify if:**
- ✅ You prefer Netlify's features
- ✅ You're already using Netlify

**Use Railway if:**
- ✅ You need more server-side capabilities
- ✅ You're already using Railway

---

## Need Help Choosing?

**Recommendation:** Use **Cloudflare Pages** since your domain is already on Cloudflare. It's the simplest setup with zero DNS configuration needed!

See `CLOUDFLARE_DEPLOY.md` for Cloudflare Pages setup instructions.

