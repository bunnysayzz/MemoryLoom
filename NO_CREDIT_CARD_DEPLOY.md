# Deploy MemoryLoom Without a Credit Card

Quick guide for deploying MemoryLoom to platforms that don't require credit card verification.

## 🆓 Platforms That Don't Require Credit Card

| Platform | Free Tier | MCP Support | Best For |
|----------|-----------|-------------|----------|
| **Railway** | $5 credit/month | ✅ Full | Recommended - Easy setup |
| **Fly.io** | 3 VMs free | ✅ Full | Recommended - Global edge |
| **Vercel** | Generous limits | ⚠️ Limited | Web UI only |
| **Netlify** | 100GB bandwidth | ⚠️ Limited | Web UI only |

**Recommendation:** Use **Railway** or **Fly.io** for full MCP support without credit card.

---

## Option 1: Railway (Easiest)

### Why Railway?
- ✅ No credit card required
- ✅ $5 free credit per month
- ✅ Full MCP stdio support
- ✅ Automatic Postgres addon
- ✅ GitHub integration
- ✅ Simple CLI

### One-Click Deploy

[![Deploy to Railway](https://img.shields.io/badge/Deploy-Railway-0B0D0E?logo=railway&logoColor=white)](https://railway.app/new/template?template=https://github.com/bunnysayzz/memoryloom)

### Manual Deployment

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login (opens browser)
railway login

# 3. Clone MemoryLoom
git clone https://github.com/bunnysayzz/memoryloom.git
cd memoryloom

# 4. Initialize Railway project
railway init

# 5. Deploy
railway up

# 6. View logs
railway logs

# 7. Get URL
railway domain
```

### Add Postgres (Optional)

```bash
# Add Postgres plugin
railway add postgresql

# Set environment variable
railway variables set MEMORYLOOM_STORAGE_MODE=postgres

# Railway automatically sets DATABASE_URL
```

### What You Get

- ✅ Free deployment
- ✅ Automatic HTTPS
- ✅ Custom domain support
- ✅ $5 credit/month (enough for small apps)
- ✅ No credit card needed

---

## Option 2: Fly.io (Global Edge)

### Why Fly.io?
- ✅ No credit card required
- ✅ 3 free VMs (shared-cpu-1x)
- ✅ Full MCP stdio support
- ✅ Global edge deployment
- ✅ Low latency worldwide

### Manual Deployment

```bash
# 1. Install Fly CLI
# macOS/Linux
curl -L https://fly.io/install.sh | sh

# Windows (PowerShell)
iwr https://fly.io/install.ps1 -useb | iex

# 2. Login (opens browser)
fly auth login

# 3. Clone MemoryLoom
git clone https://github.com/bunnysayzz/memoryloom.git
cd memoryloom

# 4. Launch app (follow prompts)
fly launch

# Prompts:
# - App name: memoryloom (or your choice)
# - Region: Choose closest to you
# - Postgres: No (or Yes if needed)
# - Deploy now: Yes

# 5. View logs
fly logs

# 6. Open app
fly open
```

### Add Postgres (Optional)

```bash
# Create Postgres cluster
fly postgres create

# Attach to app
fly postgres attach <postgres-app-name>

# Set storage mode
fly secrets set MEMORYLOOM_STORAGE_MODE=postgres
```

### What You Get

- ✅ Free deployment (3 VMs)
- ✅ Automatic HTTPS
- ✅ Global edge network
- ✅ Custom domains
- ✅ No credit card needed

---

## Option 3: Vercel (Web UI Only)

### ⚠️ Important Limitations

- ❌ No MCP stdio support (serverless functions)
- ✅ Web UI works fine
- ✅ Health endpoints work
- ❌ Cannot connect editors via MCP

### When to Use Vercel

Use Vercel if you only want to:
- Host the web UI
- Provide health check endpoints
- Serve static content

**Don't use Vercel if you need:**
- MCP server for editors
- Long-running processes
- Persistent connections

### One-Click Deploy

[![Deploy to Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel&logoColor=white)](https://vercel.com/new/clone?repository-url=https://github.com/bunnysayzz/memoryloom)

### Manual Deployment

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Clone and deploy
git clone https://github.com/bunnysayzz/memoryloom.git
cd memoryloom
vercel

# 4. Production deployment
vercel --prod
```

---

## Option 4: Netlify (Web UI Only)

### ⚠️ Important Limitations

Same as Vercel:
- ❌ No MCP stdio support
- ✅ Web UI works
- ❌ Cannot connect editors

### One-Click Deploy

[![Deploy to Netlify](https://img.shields.io/badge/Deploy-Netlify-00C7B7?logo=netlify&logoColor=white)](https://app.netlify.com/start/deploy?repository=https://github.com/bunnysayzz/memoryloom)

### Manual Deployment

```bash
# 1. Install Netlify CLI
npm install -g netlify-cli

# 2. Login
netlify login

# 3. Clone and deploy
git clone https://github.com/bunnysayzz/memoryloom.git
cd memoryloom
netlify init
netlify deploy

# 4. Production deployment
netlify deploy --prod
```

---

## Comparison: Railway vs Fly.io

| Feature | Railway | Fly.io |
|---------|---------|--------|
| **Setup Difficulty** | ⭐ Easiest | ⭐⭐ Medium |
| **Free Tier** | $5 credit/month | 3 VMs free |
| **MCP Support** | ✅ Full | ✅ Full |
| **Postgres** | ✅ Easy addon | ✅ Managed cluster |
| **Global Edge** | ❌ No | ✅ Yes |
| **Custom Domains** | ✅ Yes | ✅ Yes |
| **CLI Quality** | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐⭐⭐ Good |
| **Dashboard** | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐⭐ Basic |
| **Best For** | Quick deployment | Global apps |

**Recommendation:** 
- **Railway** if you want the easiest setup
- **Fly.io** if you need global edge deployment

---

## After Deployment

### 1. Verify Deployment

```bash
# Check health endpoint
curl https://your-app-url.com/health

# Expected response:
# {"status":"healthy","timestamp":"2026-04-19T10:00:00.000Z"}
```

### 2. Configure Your Editor

Since MemoryLoom is deployed remotely, you'll typically run it **locally** for MCP editor integration:

```bash
# Clone and run locally
git clone https://github.com/bunnysayzz/memoryloom.git
cd memoryloom
npm install
npm start
```

Then configure your editor to connect to `localhost`:

```json
{
  "mcpServers": {
    "memoryloom": {
      "command": "node",
      "args": ["/absolute/path/to/memoryloom/server.js"]
    }
  }
}
```

### 3. Use Deployed Instance for Web UI

Access the web UI at your deployed URL:
- Railway: `https://your-app.railway.app`
- Fly.io: `https://your-app.fly.dev`

---

## Troubleshooting

### Railway Issues

**App not starting:**
```bash
# Check logs
railway logs

# Common issues:
# - Missing environment variables
# - Port configuration
```

**Out of credit:**
```bash
# Check usage
railway status

# $5/month is usually enough for small apps
# Upgrade if needed
```

### Fly.io Issues

**Deployment fails:**
```bash
# Check logs
fly logs

# Common issues:
# - Region selection
# - Resource limits
```

**App crashes:**
```bash
# Scale up if needed
fly scale vm shared-cpu-2x

# Or add more VMs
fly scale count 2
```

---

## Cost Breakdown

### Railway

**Free tier includes:**
- $5 credit per month
- Enough for:
  - ~500 hours of runtime
  - Small Postgres database
  - Reasonable traffic

**When you'll need to pay:**
- High traffic apps
- Large databases
- Multiple services

### Fly.io

**Free tier includes:**
- 3 shared-cpu-1x VMs (256MB RAM each)
- 3GB persistent storage
- 160GB outbound data transfer

**When you'll need to pay:**
- More than 3 VMs
- Larger VM sizes
- More storage
- Higher bandwidth

---

## Best Practices

1. **Start with Railway** - Easiest to set up
2. **Monitor usage** - Check dashboard regularly
3. **Use JSON mode** - Saves database costs
4. **Enable backups** - Set `MEMORYLOOM_BACKUP_ON_WRITE=true`
5. **Set up alerts** - Get notified of issues
6. **Keep it updated** - Pull latest changes regularly

---

## Need Help?

- **Railway:** [railway.app/help](https://railway.app/help)
- **Fly.io:** [fly.io/docs](https://fly.io/docs)
- **MemoryLoom:** [GitHub Issues](https://github.com/bunnysayzz/memoryloom/issues)

---

**Last Updated:** April 2026  
**MemoryLoom Version:** 0.5.0
