# Cloudflare DNS Configuration - Step by Step

## What You're Looking At

You're in the Cloudflare DNS Records page, adding a new record for `indicator.pleasecart.net`.

## Step-by-Step Instructions

### Step 1: Change Type from "A" to "CNAME"

**What to do:**
1. Click on the **"Type"** dropdown (currently shows "A")
2. Select **"CNAME"** from the dropdown list
   - This is for subdomains (like indicator.pleasecart.net)
   - "A" records are for IP addresses (not what we need)

### Step 2: Enter Name

**What to do:**
1. Click in the **"Name (required)"** field
2. Type: `indicator`
   - This creates the subdomain: indicator.pleasecart.net
   - Do NOT use "@" (that's only for root domain)
   - Just type: `indicator`

### Step 3: Get Your Platform's CNAME Target

**First, you need to know which platform you're using:**

#### If Using Cloudflare Pages:
- **No CNAME needed!** Just add domain in Cloudflare Pages dashboard
- Cloudflare handles DNS automatically

#### If Using Vercel:
1. Go to Vercel Dashboard → Your Project
2. Settings → Domains
3. Add: `indicator.pleasecart.net`
4. Copy the CNAME target shown (e.g., `cname.vercel-dns.com`)

#### If Using Netlify:
1. Go to Netlify Dashboard → Your Site
2. Site Settings → Domain Management
3. Add: `indicator.pleasecart.net`
4. Copy the CNAME target shown

#### If Using Railway:
1. Go to Railway Dashboard → Your Service
2. Settings → Networking
3. Add custom domain: `indicator.pleasecart.net`
4. Copy the CNAME target shown

### Step 4: Enter Target (IPv4 address field becomes "Target")

**What to do:**
1. After selecting CNAME, the "IPv4 address" field changes to "Target"
2. Paste your platform's CNAME target in this field
   - Example: `your-project.railway.app`
   - Example: `cname.vercel-dns.com`
   - Example: `your-site.netlify.app`

### Step 5: Change Proxy Status to "DNS only"

**What to do:**
1. Find the **"Proxy status"** toggle (currently shows "Proxied" with orange cloud)
2. Click the toggle to turn it OFF
3. It should change to:
   - Gray cloud icon (not orange)
   - Text should say "DNS only" (not "Proxied")
   - This is important! "Proxied" can cause SSL issues

**Why DNS only?**
- Direct connection to your hosting platform
- Platform handles SSL automatically
- Simpler setup
- Recommended for most platforms

### Step 6: TTL - Leave as "Auto"

**What to do:**
- Leave **TTL** as "Auto" (it's already set correctly)

### Step 7: Save

**What to do:**
1. Click the **"Save"** button (usually at the bottom or right side of the form)
2. Wait 1-2 minutes for DNS to propagate

## Visual Guide - What Your Form Should Look Like

```
┌─────────────────────────────────────────────────────────┐
│ Type:        [CNAME ▼]          ← Change from A to CNAME│
│ Name:        indicator          ← Type "indicator"      │
│ Target:      your-platform.com  ← Paste CNAME target     │
│ Proxy:       [●] DNS only       ← Toggle OFF (gray cloud)│
│ TTL:         Auto               ← Leave as is           │
│                                                          │
│              [Save]              ← Click to save         │
└─────────────────────────────────────────────────────────┘
```

## Common Mistakes to Avoid

❌ **Don't use Type "A"** - Use "CNAME" instead
❌ **Don't use "@" in Name** - Use "indicator" (not "@")
❌ **Don't leave Proxy as "Proxied"** - Turn it OFF to "DNS only"
❌ **Don't use IP address** - Use the CNAME target from your platform

✅ **Do use Type "CNAME"**
✅ **Do use Name "indicator"**
✅ **Do use DNS only (gray cloud)**
✅ **Do use the CNAME target from your platform**

## After Saving

1. **DNS Propagation:** < 1 minute (Cloudflare is fast!)
2. **SSL Certificate:** Your platform will provision SSL automatically
   - Usually takes 1-5 minutes
   - Check your platform's dashboard for SSL status
3. **Test:** Visit `https://indicator.pleasecart.net` (may take a few minutes)

## Troubleshooting

### "Invalid target" error
- Make sure you're using CNAME (not A record)
- Check the target doesn't have `http://` or `https://`
- Should be just the domain: `example.com` (not `https://example.com`)

### Domain not working after saving
- Wait 2-3 minutes for DNS propagation
- Check your platform's deployment is live
- Verify the CNAME target is correct
- Make sure Proxy is set to "DNS only" (gray cloud)

### SSL certificate not working
- Ensure Proxy is "DNS only" (not Proxied)
- Wait 5-10 minutes for SSL provisioning
- Check your platform's SSL status

## Quick Checklist

Before clicking Save, verify:
- [ ] Type is set to **CNAME** (not A)
- [ ] Name is **indicator** (not @ or empty)
- [ ] Target is your platform's CNAME target (pasted correctly)
- [ ] Proxy is **DNS only** (gray cloud, not orange)
- [ ] TTL is **Auto**

## Still Need Help?

**Which platform are you deploying to?**
- Cloudflare Pages → No DNS needed, just add domain in Pages
- Vercel → Get CNAME from Vercel domains settings
- Netlify → Get CNAME from Netlify domain management
- Railway → Get CNAME from Railway networking settings

Tell me which platform and I can give you the exact CNAME target format!

