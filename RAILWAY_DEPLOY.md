# Railway Deployment Guide for indicator.pleasecart.net

Railway is a modern cloud platform that makes deploying applications simple. Perfect for your TradingIndicator app!

## Step 1: Push to GitHub (if not done)

```bash
git remote add origin https://github.com/YOUR_USERNAME/TradingIndicator.git
git branch -M main
git push -u origin main
```

## Step 2: Deploy to Railway

### Option A: Deploy from GitHub (Recommended)

1. **Sign up/Login:**
   - Go to https://railway.com
   - Click "Start a New Project"
   - Sign up with GitHub (recommended for easy integration)

2. **Create New Project:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Authorize Railway to access your GitHub
   - Select your `TradingIndicator` repository

3. **Configure Service:**
   - Railway will auto-detect it's a Node.js/Vite project
   - It will automatically:
     - Install dependencies: `npm install`
     - Build: `npm run build`
     - Serve: `npm run preview` (or configure custom command)

4. **Configure Build Settings (if needed):**
   - Go to Settings → Build
   - **Build Command:** `npm run build`
   - **Start Command:** `npm run preview` (or use a static file server)
   - **Output Directory:** `dist`

5. **Add Custom Domain:**
   - Go to Settings → Networking
   - Click "Add Domain"
   - Enter: `indicator.pleasecart.net`
   - Railway will provide DNS instructions

### Option B: Deploy from CLI

1. **Install Railway CLI:**
   ```bash
   npm i -g @railway/cli
   ```

2. **Login:**
   ```bash
   railway login
   ```

3. **Initialize Project:**
   ```bash
   railway init
   ```

4. **Deploy:**
   ```bash
   railway up
   ```

## Step 3: Configure DNS in Cloudflare

Since your domain is on Cloudflare:

1. **Get DNS Info from Railway:**
   - In Railway dashboard → Settings → Networking
   - Add custom domain: `indicator.pleasecart.net`
   - Railway will show you a CNAME target (e.g., `your-project.railway.app` or `cname.railway.app`)

2. **Add CNAME in Cloudflare:**
   - Go to Cloudflare Dashboard: https://dash.cloudflare.com
   - Select your domain: **pleasecart.net**
   - Click **DNS** in left sidebar → **Records** tab
   - Click **"Add record"** button
   - Configure:
     - **Type:** CNAME (select from dropdown)
     - **Name:** `indicator` (creates indicator.pleasecart.net)
     - **Target:** (paste the Railway CNAME target exactly as shown)
     - **Proxy status:** 
       - **DNS only** (gray cloud icon) - ✅ **Recommended for Railway**
         - Direct connection to Railway
         - Railway handles SSL automatically
       - **Proxied** (orange cloud icon) - Alternative
         - Traffic goes through Cloudflare CDN
         - May need additional SSL configuration
     - **TTL:** Auto (default)
   - Click **"Save"**

3. **Wait for Propagation:**
   - **DNS:** < 1 minute (Cloudflare is fast!)
   - **SSL:** 1-5 minutes (Railway auto-provisions)
   - Check Railway dashboard for SSL status

**📖 See CLOUDFLARE_DNS_SETUP.md for detailed step-by-step guide with screenshots**

## Step 4: Configure for Static Site (Vite Build)

Since Vite builds a static site, you have two options:

### Option A: Use Railway's Static File Serving

1. **Install serve package:**
   ```bash
   npm install --save-dev serve
   ```

2. **Update package.json:**
   ```json
   {
     "scripts": {
       "preview": "serve -s dist -l 3000"
     }
   }
   ```

3. **Configure Railway:**
   - Build Command: `npm run build`
   - Start Command: `npm run preview`
   - Or use Railway's static site template

### Option B: Use Railway's Static Site Template

1. **Create `railway.json` in project root:**
   ```json
   {
     "$schema": "https://railway.app/railway.schema.json",
     "build": {
       "builder": "NIXPACKS",
       "buildCommand": "npm run build"
     },
     "deploy": {
       "startCommand": "npx serve -s dist -l $PORT",
       "restartPolicyType": "ON_FAILURE",
       "restartPolicyMaxRetries": 10
     }
   }
   ```

2. **Or use Railway's Static Site service:**
   - When creating project, select "Static Site" template
   - Point to your `dist` folder

## Step 5: Environment Variables (if needed)

If you need environment variables:

1. **In Railway Dashboard:**
   - Go to your service → Variables
   - Add any environment variables
   - Example: `NODE_ENV=production`

2. **For API Keys:**
   - Add them as environment variables
   - They'll be available at build/runtime

## Step 6: Automatic Deployments

Railway automatically deploys when you push to GitHub:
- Push to `main` branch = Production deployment
- Each commit triggers a new deployment
- View deployment logs in Railway dashboard

## Railway Pricing

- **Free Hobby Plan:** $5/month credit (usually enough for small apps)
- **Pro Plan:** $20/month for more resources
- **Pay-as-you-go:** Only pay for what you use

## Troubleshooting

### Build Fails:
- Check Railway deployment logs
- Verify `npm run build` works locally
- Check that all dependencies are in `package.json`

### Domain Not Working:
- Verify DNS CNAME record in Cloudflare
- Check Railway domain settings
- Wait 1-5 minutes for DNS/SSL propagation

### Static Files Not Serving:
- Ensure `dist` folder is being built
- Check start command is correct
- Verify `serve` package is installed

### Port Issues:
- Railway sets `$PORT` environment variable
- Use `$PORT` in your start command: `npx serve -s dist -l $PORT`

## Recommended Configuration

For a Vite static site on Railway:

1. **Install serve:**
   ```bash
   npm install --save-dev serve
   ```

2. **Update package.json:**
   ```json
   {
     "scripts": {
       "build": "tsc && vite build",
       "preview": "serve -s dist -l $PORT"
     }
   }
   ```

3. **Railway will automatically:**
   - Run `npm install`
   - Run `npm run build`
   - Run `npm run preview` on port from `$PORT`

## Benefits of Railway

- ✅ Simple deployment from GitHub
- ✅ Automatic HTTPS/SSL
- ✅ Environment variable management
- ✅ Deployment logs and monitoring
- ✅ Easy custom domain setup
- ✅ Pay-as-you-go pricing
- ✅ Great developer experience

## Quick Start

```bash
# 1. Push to GitHub
git push origin main

# 2. In Railway:
#    - New Project → Deploy from GitHub
#    - Select repository
#    - Add domain: indicator.pleasecart.net
#    - Configure DNS in Cloudflare
#    - Done!
```

Your app will be live at: **https://indicator.pleasecart.net**

