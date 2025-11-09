# Deployment Guide for indicator.pleasecart.net

## Step 1: Push to GitHub

### If you don't have a GitHub repository yet:

1. **Create a new repository on GitHub:**
   - Go to https://github.com/new
   - Repository name: `TradingIndicator` (or your preferred name)
   - Choose Public or Private
   - **Don't** initialize with README, .gitignore, or license (we already have these)
   - Click "Create repository"

2. **Add remote and push:**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/TradingIndicator.git
   git branch -M main
   git push -u origin main
   ```

### If you already have a GitHub repository:

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

## Step 2: Deploy to indicator.please-cart.net

### Option A: Vercel (Recommended - Free, Easy)

1. **Sign up/Login:**
   - Go to https://vercel.com
   - Sign up with GitHub

2. **Import Project:**
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Vite settings

3. **Configure Build Settings:**
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. **Add Custom Domain:**
   - Go to Project Settings → Domains
   - Add `indicator.pleasecart.net`
   - Follow DNS instructions (add CNAME record)

5. **Deploy:**
   - Click "Deploy"
   - Your site will be live!

### Option B: Netlify (Alternative - Free)

1. **Sign up/Login:**
   - Go to https://netlify.com
   - Sign up with GitHub

2. **Import Project:**
   - Click "Add new site" → "Import an existing project"
   - Connect to GitHub and select your repository

3. **Configure Build Settings:**
   - Build command: `npm run build`
   - Publish directory: `dist`

4. **Add Custom Domain:**
   - Go to Site Settings → Domain Management
   - Add custom domain: `indicator.pleasecart.net`
   - Follow DNS instructions

5. **Deploy:**
   - Click "Deploy site"

### Option C: Cloudflare Pages (Free, Fast CDN)

1. **Sign up/Login:**
   - Go to https://pages.cloudflare.com
   - Sign up with GitHub

2. **Create Project:**
   - Connect GitHub repository
   - Build command: `npm run build`
   - Build output directory: `dist`

3. **Add Custom Domain:**
   - Go to Custom Domains
   - Add `indicator.pleasecart.net`
   - Update DNS records as instructed

## Step 3: DNS Configuration (Cloudflare)

Since `pleasecart.net` is hosted on Cloudflare, configure DNS in your Cloudflare dashboard:

### For Vercel:
1. In Vercel, go to Project Settings → Domains
2. Add `indicator.pleasecart.net`
3. Vercel will show you a target (e.g., `cname.vercel-dns.com`)
4. In Cloudflare Dashboard:
   - Go to DNS → Records
   - Click "Add record"
   - **Type:** CNAME
   - **Name:** indicator
   - **Target:** (value from Vercel)
   - **Proxy status:** DNS only (gray cloud) or Proxied (orange cloud)
   - Click "Save"

### For Netlify:
1. In Netlify, go to Site Settings → Domain Management
2. Add `indicator.pleasecart.net`
3. Get the target from Netlify
4. In Cloudflare Dashboard:
   - **Type:** CNAME
   - **Name:** indicator
   - **Target:** (value from Netlify)
   - **Proxy status:** DNS only or Proxied
   - Click "Save"

### For Cloudflare Pages (Recommended for Cloudflare domains):
1. In Cloudflare Dashboard, go to Pages
2. Connect your GitHub repository
3. Build settings:
   - Build command: `npm run build`
   - Build output directory: `dist`
4. Add custom domain:
   - Go to Custom Domains in your Pages project
   - Add `indicator.pleasecart.net`
   - Cloudflare will automatically configure DNS

**Note:** With Cloudflare, DNS changes propagate almost instantly (usually < 1 minute).

## Step 4: Environment Variables (if needed)

If you need to set any environment variables:
- **Vercel:** Project Settings → Environment Variables
- **Netlify:** Site Settings → Environment Variables
- **Cloudflare:** Pages → Settings → Environment Variables

## Step 5: Automatic Deployments

All platforms automatically deploy when you push to GitHub:
- Push to `main` branch = Production deployment
- Create pull request = Preview deployment

## Troubleshooting

### Build fails:
- Check that `npm run build` works locally
- Review build logs in deployment platform
- Ensure all dependencies are in `package.json`

### Domain not working:
- Wait 24-48 hours for DNS propagation
- Check DNS records are correct
- Verify SSL certificate is issued (automatic on all platforms)

### App not loading:
- Check browser console for errors
- Verify API keys are set (if using environment variables)
- Check that build output is correct

## Recommended: Vercel

Vercel is recommended because:
- ✅ Free tier is generous
- ✅ Automatic HTTPS
- ✅ Fast global CDN
- ✅ Easy GitHub integration
- ✅ Preview deployments for PRs
- ✅ Simple custom domain setup

