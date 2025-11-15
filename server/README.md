# Yahoo Finance Proxy Server Setup

## Quick Start

### Option 1: Install in Server Directory (Recommended)
```bash
cd server
npm install
npm start
```

### Option 2: Install Globally in Project Root
```bash
npm install express cors node-fetch
npm run proxy
```

The server will start on `http://localhost:3002`

### 3. Update Environment Variables (Production)

Create a `.env.production` file:
```
VITE_PROXY_URL=http://localhost:3002
```

Or set it when deploying:
- **Vercel/Netlify**: Set environment variable `VITE_PROXY_URL` to your proxy server URL
- **Docker**: Set in docker-compose.yml or Dockerfile
- **Traditional hosting**: Set in your server environment

## Development

The Vite dev server already has a proxy configured in `vite.config.ts`, so you don't need to run the proxy server during development.

## Production Deployment

### Option 1: Deploy Proxy as Separate Service
1. Deploy `server/proxy.js` to a Node.js hosting service (Heroku, Railway, Render, etc.)
2. Set `VITE_PROXY_URL` environment variable to your proxy server URL
3. Deploy your frontend

### Option 2: Deploy Proxy with Frontend (Same Server)
1. Use a process manager like PM2
2. Run both frontend (static) and proxy server
3. Configure reverse proxy (nginx) to route `/api/yahoo` to proxy server

### Option 3: Serverless Function
Convert `server/proxy.js` to a serverless function:
- **Vercel**: Create `api/yahoo.js` in `/api` folder
- **Netlify**: Create `netlify/functions/yahoo.js`
- **AWS Lambda**: Deploy as Lambda function

## Testing

Test the proxy server:
```bash
curl http://localhost:3002/api/yahoo?symbol=BTC
```

## Environment Variables

- `PROXY_PORT`: Port for proxy server (default: 3002)
- `VITE_PROXY_URL`: Proxy server URL for frontend (production only)

