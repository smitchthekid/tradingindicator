# Cloudflare DNS Configuration - Exact Settings

## Your Railway Domain
**bg07chks.up.railway.app**

## Cloudflare DNS Record to Add

### Exact Settings:

```
Type:    CNAME
Name:    indicator
Target:  bg07chks.up.railway.app
Proxy:   DNS only (gray cloud)
TTL:     Auto
```

## Step-by-Step Instructions

### Step 1: Go to Cloudflare DNS

1. **Go to:** https://dash.cloudflare.com
2. **Login** to your account
3. **Select domain:** pleasecart.net
4. **Click:** "DNS" in left sidebar
5. **Click:** "Records" tab

### Step 2: Add CNAME Record

1. **Click "Add record"** button

2. **Fill in exactly:**
   - **Type:** Select **"CNAME"** from dropdown
   - **Name:** Type `indicator` (exactly as shown)
   - **Target:** Type `bg07chks.up.railway.app` (exactly as shown)
   - **Proxy status:** Click toggle to **"DNS only"** (gray cloud icon)
     - ⚠️ **CRITICAL:** Must be gray cloud, NOT orange
   - **TTL:** Leave as **"Auto"**

3. **Click "Save"**

## Visual Guide

```
Cloudflare DNS Record Form:
┌─────────────────────────────────────────┐
│ Type:        [CNAME ▼]                   │
│ Name:        indicator                    │
│ Target:      bg07chks.up.railway.app    │
│ Proxy:       [●] DNS only  [ ] Proxied   │
│ TTL:         Auto                        │
│                                          │
│              [Save]                      │
└─────────────────────────────────────────┘
```

## After Saving

### Wait for Propagation
- **DNS:** 1-5 minutes
- **SSL:** 5-10 minutes (Railway auto-provisions)

### Test
1. **Wait 2-3 minutes**
2. **Visit:** `https://indicator.pleasecart.net`
3. **Should load your Railway app!**

## Troubleshooting

### Still Getting Error 1016?

1. **Check DNS record exists:**
   - Go to Cloudflare → DNS → Records
   - Verify CNAME for `indicator` exists

2. **Verify Target is correct:**
   - Should be exactly: `bg07chks.up.railway.app`
   - No spaces, no typos

3. **Check Proxy setting:**
   - Must be **DNS only** (gray cloud)
   - NOT Proxied (orange cloud)

4. **Test Railway domain directly:**
   - Visit: `https://bg07chks.up.railway.app`
   - Should load your app
   - If not, Railway deployment may have issues

5. **Wait longer:**
   - DNS can take up to 5 minutes
   - SSL can take up to 10 minutes

### Domain Not Resolving

1. **Verify Railway works:**
   - Test: `https://bg07chks.up.railway.app`
   - Should load your app

2. **Check for typos:**
   - In DNS record Name: `indicator`
   - In DNS record Target: `bg07chks.up.railway.app`

3. **Clear browser cache:**
   - Press `Ctrl+Shift+R` (hard refresh)

## Quick Checklist

Before saving, verify:
- [ ] Type is **CNAME**
- [ ] Name is **indicator** (not @)
- [ ] Target is **bg07chks.up.railway.app** (exact, no typos)
- [ ] Proxy is **DNS only** (gray cloud, not orange)
- [ ] TTL is **Auto**

## Summary

**What you're doing:**
- Pointing `indicator.pleasecart.net` → `bg07chks.up.railway.app`

**How:**
- Add CNAME record in Cloudflare
- Name: `indicator`
- Target: `bg07chks.up.railway.app`
- Proxy: DNS only (gray cloud)

**Result:**
- `indicator.pleasecart.net` will load your Railway app
- SSL automatically provisioned by Railway
- Live in 1-5 minutes

That's it! Once you add this DNS record, your domain will work.

