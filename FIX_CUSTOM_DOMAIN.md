# Fix indicator.pleasecart.net - DNS Configuration

## Current Status

✅ **Railway app works:** https://tradingindicator-production.up.railway.app/
❌ **Custom domain not working:** indicator.pleasecart.net

## Problem

The DNS record in Cloudflare is either:
- Not configured correctly
- Pointing to wrong domain
- Proxy setting is wrong
- Not propagated yet

## Solution: Fix Cloudflare DNS

### Step 1: Go to Cloudflare DNS

1. **Go to:** https://dash.cloudflare.com
2. **Select domain:** pleasecart.net
3. **Click:** "DNS" in left sidebar
4. **Click:** "Records" tab

### Step 2: Check Existing DNS Record

1. **Look for CNAME record** with Name: `indicator`
2. **If it exists:**
   - Click **"Edit"** (pencil icon)
   - Check the Target - should be: `tradingindicator-production.up.railway.app`
   - If wrong, update it
3. **If it doesn't exist:**
   - Click **"Add record"**
   - Create new CNAME record

### Step 3: Configure DNS Record

**Exact settings:**

```
Type:    CNAME
Name:    indicator
Target:  tradingindicator-production.up.railway.app
Proxy:   DNS only (gray cloud) ← CRITICAL!
TTL:     Auto
```

**Important details:**
- **Name:** Must be exactly `indicator` (not `@` or `indicator.pleasecart.net`)
- **Target:** Must be exactly `tradingindicator-production.up.railway.app`
- **Proxy:** Must be **DNS only** (gray cloud icon, toggle OFF)
  - ⚠️ If it's "Proxied" (orange cloud), change it to "DNS only"
  - This is the most common cause of issues!

### Step 4: Save and Wait

1. **Click "Save"**
2. **Wait 1-5 minutes** for DNS propagation
3. **Wait 5-10 minutes** for SSL certificate (Railway auto-provisions)

### Step 5: Test

1. **Test DNS resolution:**
   ```powershell
   nslookup indicator.pleasecart.net
   ```
   Should show Railway's IP or CNAME target

2. **Test in browser:**
   - Visit: `https://indicator.pleasecart.net`
   - Should load your Railway app

## Common Issues

### Issue 1: Proxy Set to "Proxied" (Orange Cloud)

**Symptom:** Domain doesn't work, Error 1016, or SSL issues

**Fix:**
1. Edit the CNAME record
2. Change Proxy to **"DNS only"** (gray cloud)
3. Save and wait 1-5 minutes

### Issue 2: Wrong Target Domain

**Symptom:** Domain points to wrong place or doesn't resolve

**Fix:**
1. Edit the CNAME record
2. Update Target to: `tradingindicator-production.up.railway.app`
3. Make sure no typos
4. Save

### Issue 3: DNS Record Doesn't Exist

**Symptom:** Domain not found at all

**Fix:**
1. Add new CNAME record
2. Use exact settings above
3. Save

### Issue 4: DNS Not Propagated Yet

**Symptom:** Just added record, not working yet

**Fix:**
1. Wait 1-5 minutes
2. Clear browser cache: `Ctrl+Shift+R`
3. Try again

## Step-by-Step: Add/Edit DNS Record

### If Record Doesn't Exist:

1. **Click "Add record"**
2. **Fill in:**
   - Type: **CNAME**
   - Name: **indicator**
   - Target: **tradingindicator-production.up.railway.app**
   - Proxy: **DNS only** (gray cloud)
   - TTL: **Auto**
3. **Click "Save"**

### If Record Exists:

1. **Click "Edit"** (pencil icon) on the CNAME record
2. **Verify/Update:**
   - Name: `indicator`
   - Target: `tradingindicator-production.up.railway.app`
   - Proxy: **DNS only** (gray cloud) ← Most important!
3. **Click "Save"**

## Visual Guide

```
Cloudflare DNS Record:
┌─────────────────────────────────────────────┐
│ Type:        [CNAME ▼]                       │
│ Name:        indicator                        │
│ Target:      tradingindicator-production...  │
│ Proxy:       [●] DNS only  [ ] Proxied      │
│ TTL:         Auto                            │
│                                              │
│              [Save]                          │
└─────────────────────────────────────────────┘
```

## Verification Checklist

Before saving, verify:
- [ ] Type is **CNAME**
- [ ] Name is **indicator** (not @, not full domain)
- [ ] Target is **tradingindicator-production.up.railway.app** (exact, no typos)
- [ ] Proxy is **DNS only** (gray cloud, NOT orange)
- [ ] TTL is **Auto**

## After Fixing

1. **Wait 1-5 minutes** for DNS propagation
2. **Test DNS:**
   ```powershell
   nslookup indicator.pleasecart.net
   ```
3. **Test in browser:**
   - Visit: `https://indicator.pleasecart.net`
   - Should load your Railway app

## Still Not Working?

1. **Double-check Proxy setting:**
   - Must be **DNS only** (gray cloud)
   - NOT Proxied (orange cloud)

2. **Verify Target:**
   - Exact: `tradingindicator-production.up.railway.app`
   - No spaces, no typos

3. **Wait longer:**
   - DNS: Up to 5 minutes
   - SSL: Up to 10 minutes

4. **Clear browser cache:**
   - `Ctrl+Shift+R` (hard refresh)

5. **Test Railway domain directly:**
   - Make sure `https://tradingindicator-production.up.railway.app` still works

## Summary

**What to do:**
1. Go to Cloudflare → DNS → Records
2. Find/edit CNAME for `indicator`
3. Set Target: `tradingindicator-production.up.railway.app`
4. Set Proxy: **DNS only** (gray cloud)
5. Save and wait 1-5 minutes

**Result:**
- `indicator.pleasecart.net` → `tradingindicator-production.up.railway.app`
- SSL automatically provisioned by Railway
- Domain works!

The most common issue is Proxy being set to "Proxied" instead of "DNS only". Make sure it's gray cloud!

