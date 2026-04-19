# MemoryLoom Deployment Guide

Complete guide for deploying MemoryLoom to various cloud platforms.

## 🆓 Quick Start - No Credit Card Needed

**Want to deploy immediately without a credit card?**

1. **[Railway](#railway)** - $5 free credit/month, no card required
2. **[Fly.io](#flyio)** - 3 free VMs, no card required

**Note:** Some platforms (Heroku, Render, Koyeb) offer free tiers but require credit card verification. Others (DigitalOcean, Google Cloud, Azure) are paid services.

---

## Table of Contents

- [Platform Comparison](#platform-comparison)
- [Container Platforms](#container-platforms)
  - [Heroku](#heroku)
  - [Render](#render)
  - [Railway](#railway)
  - [Fly.io](#flyio)
  - [Koyeb](#koyeb)
  - [DigitalOcean App Platform](#digitalocean-app-platform)
- [Cloud Platforms](#cloud-platforms)
  - [Google Cloud Run](#google-cloud-run)
  - [Azure Container Apps](#azure-container-apps)
- [Serverless Platforms](#serverless-platforms)
  - [Vercel](#vercel)
  - [Netlify](#netlify)
- [Docker Deployment](#docker-deployment)
- [Environment Variables](#environment-variables)
- [Post-Deployment](#post-deployment)

---

## Platform Comparison

| Platform | MCP Support | Free Tier | Credit Card Required | Setup Difficulty | Best For |
|----------|-------------|-----------|----------------------|------------------|----------|
| **Railway** | ✅ Full | ✅ $5 credit/month | ❌ No | ⭐ Easy | No credit card needed |
| **Fly.io** | ✅ Full | ✅ 3 VMs free | ❌ No | ⭐⭐ Medium | Global edge, no card |
| **Vercel** | ⚠️ Limited | ✅ Generous | ❌ No | ⭐ Easy | Static sites only |
| **Netlify** | ⚠️ Limited | ✅ 100GB bandwidth | ❌ No | ⭐ Easy | Static sites only |
| **Heroku** | ✅ Full | ✅ 550 hours/month | ✅ Yes | ⭐ Easy | Quick deployment |
| **Render** | ✅ Full | ✅ 750 hours/month | ✅ Yes | ⭐ Easy | Free hosting |
| **Koyeb** | ✅ Full | ✅ 1 service free | ✅ Yes | ⭐ Easy | European hosting |
| **DigitalOcean** | ✅ Full | ❌ No | ✅ Yes | ⭐⭐ Medium | Production apps |
| **Google Cloud** | ✅ Full | ✅ $300 credit | ✅ Yes | ⭐⭐⭐ Hard | Enterprise scale |
| **Azure** | ✅ Full | ✅ $200 credit | ✅ Yes | ⭐⭐⭐ Hard | Enterprise integration |

**🆓 No Credit Card Required:** Railway, Fly.io, Vercel, Netlify  
**💳 Credit Card for Verification:** Heroku, Render, Koyeb (free tier available after verification)  
**💰 Paid Only:** DigitalOcean ($5/month minimum)

**Recommendation:** Use **Railway** or **Fly.io** for truly free deployment without credit card. For full MCP support, avoid serverless platforms (Vercel, Netlify).

---

## Container Platforms

### Heroku

**Best for:** Quick deployment with minimal configuration

#### One-Click Deploy

[![Deploy to Heroku](https://img.shields.io/badge/Deploy-Heroku-430098?logo=heroku&logoColor=white)](https://heroku.com/deploy?template=https://github.com/bunnysayzz/memoryloom)

#### Manual Deployment

```bash
# Install Heroku CLI
brew install heroku/brew/heroku  # macOS
# or download from https://devcenter.heroku.com/articles/heroku-cli

# Login
heroku login

# Create app
heroku create your-memoryloom-app

# Set environment variables
heroku config:set MEMORYLOOM_STORAGE_MODE=json
heroku config:set MEMORYLOOM_LOG_LEVEL=info
heroku config:set MEMORYLOOM_HEALTH_PORT=8080

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

#### Using Postgres on Heroku

```bash
# Add Postgres addon
heroku addons:create heroku-postgresql:mini

# Set storage mode
heroku config:set MEMORYLOOM_STORAGE_MODE=postgres

# Postgres URL is automatically set as DATABASE_URL
# MemoryLoom will use it automatically
```

---

### Render

**Best for:** Free hosting with automatic SSL

**⚠️ Note:** Render requires a credit card on file for verification (temporary $1 authorization, not charged). If you don't want to provide a credit card, use [Railway](#railway) or [Fly.io](#flyio) instead.

#### One-Click Deploy

[![Deploy to Render](https://img.shields.io/badge/Deploy-Render-46E3B7?logo=render&logoColor=black)](https://render.com/deploy?repo=https://github.com/bunnysayzz/memoryloom)

#### Manual Deployment

1. **Create account** at [render.com](https://render.com)

2. **New Web Service:**
   - Connect your GitHub repository
   - Name: `memoryloom`
   - Environment: `Docker`
   - Plan: `Free`

3. **Environment Variables:**
   ```
   MEMORYLOOM_STORAGE_MODE=json
   MEMORYLOOM_DATA_DIR=/app/data
   MEMORYLOOM_LOG_LEVEL=info
   MEMORYLOOM_HEALTH_PORT=8080
   ```

4. **Deploy** - Render will automatically build and deploy

#### Using Postgres on Render

1. **Create Postgres Database:**
   - Dashboard → New → PostgreSQL
   - Name: `memoryloom-db`
   - Plan: `Free`

2. **Add Environment Variable:**
   ```
   MEMORYLOOM_STORAGE_MODE=postgres
   MEMORYLOOM_POSTGRES_URL=<internal-connection-string>
   ```

---

### Railway

**Best for:** Developer-friendly deployment with $5 free credit

#### One-Click Deploy

[![Deploy to Railway](https://img.shields.io/badge/Deploy-Railway-0B0D0E?logo=railway&logoColor=white)](https://railway.app/new/template?template=https://github.com/bunnysayzz/memoryloom)

#### Manual Deployment

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Link to project
railway link

# Deploy
railway up

# View logs
railway logs
```

#### Using Postgres on Railway

```bash
# Add Postgres plugin
railway add postgresql

# Set environment variable
railway variables set MEMORYLOOM_STORAGE_MODE=postgres

# Railway automatically sets DATABASE_URL
```

---

### Fly.io

**Best for:** Global edge deployment with low latency

#### One-Click Deploy

[![Deploy to Fly.io](https://img.shields.io/badge/Deploy-Fly.io-8B5CF6?logo=flydotio&logoColor=white)](https://fly.io/docs/launch/deploy/)

#### Manual Deployment

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh  # macOS/Linux
# or download from https://fly.io/docs/hands-on/install-flyctl/

# Login
fly auth login

# Launch app
fly launch

# Follow prompts:
# - App name: memoryloom
# - Region: Choose closest to you
# - Postgres: Yes (if needed)

# Deploy
fly deploy

# View logs
fly logs

# Open app
fly open
```

#### Configuration

The `fly.toml` file is already configured. Customize if needed:

```toml
app = "your-memoryloom-app"
primary_region = "sin"  # Change to your region

[env]
  MEMORYLOOM_STORAGE_MODE = "json"
  MEMORYLOOM_DATA_DIR = "/app/data"
  MEMORYLOOM_LOG_LEVEL = "info"
```

---

### Koyeb

**Best for:** European hosting with free tier

#### One-Click Deploy

[![Deploy to Koyeb](https://img.shields.io/badge/Deploy-Koyeb-121212?logo=koyeb&logoColor=white)](https://app.koyeb.com/deploy?type=git&repository=https://github.com/bunnysayzz/memoryloom)

#### Manual Deployment

1. **Create account** at [koyeb.com](https://www.koyeb.com)

2. **Create App:**
   - Dashboard → Create App
   - Select: GitHub repository
   - Repository: `bunnysayzz/memoryloom`
   - Branch: `main`

3. **Configure:**
   - Builder: Docker
   - Port: 8080
   - Health check: `/health`

4. **Environment Variables:**
   ```
   MEMORYLOOM_STORAGE_MODE=json
   MEMORYLOOM_DATA_DIR=/app/data
   MEMORYLOOM_LOG_LEVEL=info
   MEMORYLOOM_HEALTH_PORT=8080
   ```

5. **Deploy** - Koyeb will build and deploy automatically

---

### DigitalOcean App Platform

**Best for:** Production applications with managed infrastructure

#### One-Click Deploy

[![Deploy to DigitalOcean](https://img.shields.io/badge/Deploy-DigitalOcean-0080FF?logo=digitalocean&logoColor=white)](https://cloud.digitalocean.com/apps/new?repo=https://github.com/bunnysayzz/memoryloom/tree/main)

#### Manual Deployment

1. **Create account** at [digitalocean.com](https://www.digitalocean.com)

2. **Create App:**
   - Apps → Create App
   - Source: GitHub
   - Repository: `bunnysayzz/memoryloom`
   - Branch: `main`

3. **Configure:**
   - Name: `memoryloom`
   - Region: Choose closest
   - Plan: Basic ($5/month)
   - Build Command: `npm install`
   - Run Command: `node server.js`

4. **Environment Variables:**
   ```
   MEMORYLOOM_STORAGE_MODE=json
   MEMORYLOOM_DATA_DIR=/app/data
   MEMORYLOOM_LOG_LEVEL=info
   MEMORYLOOM_HEALTH_PORT=8080
   ```

5. **Deploy**

#### Using Managed Postgres

1. **Create Database:**
   - Databases → Create Database
   - Engine: PostgreSQL
   - Plan: Basic ($15/month)

2. **Connect to App:**
   - App Settings → Environment Variables
   - Add: `MEMORYLOOM_STORAGE_MODE=postgres`
   - Add: `MEMORYLOOM_POSTGRES_URL=${db.DATABASE_URL}`

---

## Cloud Platforms

### Google Cloud Run

**Best for:** Enterprise-scale serverless containers

#### Prerequisites

```bash
# Install Google Cloud SDK
# macOS
brew install google-cloud-sdk

# Or download from https://cloud.google.com/sdk/docs/install

# Login
gcloud auth login

# Set project
gcloud config set project YOUR_PROJECT_ID
```

#### Deployment

```bash
# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com

# Build and deploy
gcloud builds submit --config cloudbuild.yaml

# Or deploy directly
gcloud run deploy memoryloom \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --set-env-vars MEMORYLOOM_STORAGE_MODE=json,MEMORYLOOM_LOG_LEVEL=info
```

#### Using Cloud SQL (Postgres)

```bash
# Create Cloud SQL instance
gcloud sql instances create memoryloom-db \
  --database-version=POSTGRES_14 \
  --tier=db-f1-micro \
  --region=us-central1

# Create database
gcloud sql databases create memoryloom --instance=memoryloom-db

# Get connection name
gcloud sql instances describe memoryloom-db --format='value(connectionName)'

# Deploy with Cloud SQL
gcloud run deploy memoryloom \
  --source . \
  --add-cloudsql-instances=PROJECT:REGION:memoryloom-db \
  --set-env-vars MEMORYLOOM_STORAGE_MODE=postgres,MEMORYLOOM_POSTGRES_URL=postgresql://user:pass@/memoryloom?host=/cloudsql/PROJECT:REGION:memoryloom-db
```

---

### Azure Container Apps

**Best for:** Enterprise integration with Microsoft ecosystem

#### Prerequisites

```bash
# Install Azure CLI
# macOS
brew install azure-cli

# Or download from https://docs.microsoft.com/en-us/cli/azure/install-azure-cli

# Login
az login

# Create resource group
az group create --name memoryloom-rg --location eastus

# Create container registry
az acr create --resource-group memoryloom-rg --name memoryloomacr --sku Basic

# Create container app environment
az containerapp env create \
  --name memoryloom-env \
  --resource-group memoryloom-rg \
  --location eastus
```

#### Deployment

```bash
# Build and push image
az acr build --registry memoryloomacr --image memoryloom:latest .

# Create container app
az containerapp create \
  --name memoryloom \
  --resource-group memoryloom-rg \
  --environment memoryloom-env \
  --image memoryloomacr.azurecr.io/memoryloom:latest \
  --target-port 8080 \
  --ingress external \
  --env-vars \
    MEMORYLOOM_STORAGE_MODE=json \
    MEMORYLOOM_DATA_DIR=/app/data \
    MEMORYLOOM_LOG_LEVEL=info \
    MEMORYLOOM_HEALTH_PORT=8080
```

#### Using Azure Database for PostgreSQL

```bash
# Create PostgreSQL server
az postgres flexible-server create \
  --resource-group memoryloom-rg \
  --name memoryloom-db \
  --location eastus \
  --admin-user memoryloomadmin \
  --admin-password <password> \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --version 14

# Update container app
az containerapp update \
  --name memoryloom \
  --resource-group memoryloom-rg \
  --set-env-vars \
    MEMORYLOOM_STORAGE_MODE=postgres \
    MEMORYLOOM_POSTGRES_URL="postgresql://memoryloomadmin:<password>@memoryloom-db.postgres.database.azure.com:5432/postgres"
```

---

## Serverless Platforms

**⚠️ Warning:** Serverless platforms have limitations with MCP's stdio protocol. Use container platforms for full MCP support.

### Vercel

**Best for:** Static sites and serverless functions (MCP limited)

#### One-Click Deploy

[![Deploy to Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel&logoColor=white)](https://vercel.com/new/clone?repository-url=https://github.com/bunnysayzz/memoryloom)

#### Manual Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Production deployment
vercel --prod
```

**Limitations:**
- No stdio support for MCP
- Stateless functions (memory not persistent between calls)
- Use for web UI only, not for MCP server

---

### Netlify

**Best for:** Static sites with serverless functions (MCP limited)

#### One-Click Deploy

[![Deploy to Netlify](https://img.shields.io/badge/Deploy-Netlify-00C7B7?logo=netlify&logoColor=white)](https://app.netlify.com/start/deploy?repository=https://github.com/bunnysayzz/memoryloom)

#### Manual Deployment

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Initialize
netlify init

# Deploy
netlify deploy

# Production deployment
netlify deploy --prod
```

**Limitations:**
- No stdio support for MCP
- Serverless functions have cold starts
- Use for web UI only, not for MCP server

---

## Docker Deployment

### Local Docker

```bash
# Build image
docker build -t memoryloom .

# Run container
docker run -d \
  --name memoryloom \
  -p 8080:8080 \
  -v $(pwd)/data:/app/data \
  -e MEMORYLOOM_STORAGE_MODE=json \
  -e MEMORYLOOM_LOG_LEVEL=info \
  memoryloom

# View logs
docker logs -f memoryloom

# Stop container
docker stop memoryloom
```

### Docker Compose

```bash
# Start services
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down
```

### Docker with Postgres

```yaml
# docker-compose.yml
services:
  memoryloom:
    build: .
    environment:
      MEMORYLOOM_STORAGE_MODE: postgres
      MEMORYLOOM_POSTGRES_URL: postgresql://postgres:password@postgres:5432/memoryloom
    ports:
      - "8080:8080"
    depends_on:
      - postgres

  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: memoryloom
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres-data:/var/lib/postgresql/data

volumes:
  postgres-data:
```

---

## Environment Variables

### Required Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MEMORYLOOM_STORAGE_MODE` | `json` | Storage backend (`json` or `postgres`) |
| `MEMORYLOOM_DATA_DIR` | `./data` | Data directory for JSON mode |
| `MEMORYLOOM_LOG_LEVEL` | `info` | Log level (`debug`, `info`, `warn`, `error`) |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MEMORYLOOM_DATA_FILE` | `{DATA_DIR}/memories.json` | Exact JSON file path |
| `MEMORYLOOM_BACKUP_ON_WRITE` | `false` | Enable rolling backups |
| `MEMORYLOOM_BACKUP_RETENTION` | `5` | Number of backups to keep |
| `MEMORYLOOM_POSTGRES_URL` | - | Postgres connection string |
| `MEMORYLOOM_API_KEY` | - | Optional API key for auth |
| `MEMORYLOOM_HEALTH_PORT` | `0` | HTTP health check port |
| `MEMORYLOOM_MAX_TOOL_CALLS_PER_MINUTE` | `0` | Rate limit (0=disabled) |
| `MEMORYLOOM_WEB_UI` | `true` | Enable web UI |

### Platform-Specific Variables

**Heroku:**
- `PORT` - Automatically set by Heroku
- `DATABASE_URL` - Automatically set when Postgres addon is added

**Render:**
- `PORT` - Automatically set by Render
- `DATABASE_URL` - Automatically set when Postgres is added

**Railway:**
- `PORT` - Automatically set by Railway
- `DATABASE_URL` - Automatically set when Postgres plugin is added

---

## Post-Deployment

### Verify Deployment

```bash
# Check health endpoint
curl https://your-app.herokuapp.com/health

# Expected response:
# {"status":"healthy","timestamp":"2026-04-19T10:00:00.000Z"}

# Check ready endpoint
curl https://your-app.herokuapp.com/ready

# Expected response:
# {"status":"ready","timestamp":"2026-04-19T10:00:00.000Z"}
```

### View Logs

**Heroku:**
```bash
heroku logs --tail --app your-memoryloom-app
```

**Render:**
- Dashboard → Your Service → Logs

**Railway:**
```bash
railway logs
```

**Fly.io:**
```bash
fly logs
```

### Configure Editor

After deployment, configure your editor to connect to the deployed instance:

**Note:** Most deployments are for web UI and health checks. For MCP stdio protocol, you'll typically run MemoryLoom locally and connect your editor to the local instance.

For remote MCP access, consider:
1. SSH tunneling to your deployed instance
2. Using a VPN
3. Deploying on a private network

---

## Troubleshooting

### Deployment Fails

**Check logs:**
```bash
# Heroku
heroku logs --tail

# Render
# View in dashboard

# Railway
railway logs

# Fly.io
fly logs
```

**Common issues:**
- Missing environment variables
- Port configuration incorrect
- Build command failed
- Insufficient memory/resources

### App Crashes on Startup

**Check:**
1. Environment variables are set correctly
2. Port is configured (usually 8080)
3. Health check endpoint is accessible
4. Sufficient memory allocated

### Database Connection Fails

**Verify:**
1. `MEMORYLOOM_POSTGRES_URL` is set correctly
2. Database is running and accessible
3. Credentials are correct
4. Network allows connection

### Memory Not Persisting

**For JSON mode:**
- Ensure volume is mounted correctly
- Check write permissions on data directory

**For Postgres mode:**
- Verify database connection
- Check database has sufficient storage

---

## Cost Estimates

| Platform | Free Tier | Credit Card Required | Paid Plans Start At | Notes |
|----------|-----------|----------------------|---------------------|-------|
| **Railway** | $5 credit/month | ❌ No | $5/month (usage-based) | Best for no credit card |
| **Fly.io** | 3 VMs free | ❌ No | $1.94/month (shared-cpu-1x) | Best for no credit card |
| **Vercel** | Generous limits | ❌ No | $20/month (Pro) | Serverless only |
| **Netlify** | 100GB bandwidth | ❌ No | $19/month (Pro) | Serverless only |
| **Heroku** | 550 hours/month | ✅ Yes ($1 verification) | $7/month (Eco) | Free after verification |
| **Render** | 750 hours/month | ✅ Yes ($1 verification) | $7/month (Starter) | Free after verification |
| **Koyeb** | 1 service free | ✅ Yes | $5.50/month (Nano) | Free after verification |
| **DigitalOcean** | None | ✅ Yes | $5/month (Basic) | No free tier |
| **Google Cloud** | $300 credit (90 days) | ✅ Yes | Usage-based | Credit expires |
| **Azure** | $200 credit (30 days) | ✅ Yes | Usage-based | Credit expires |

**💡 Tip:** If you don't have a credit card, start with Railway or Fly.io. Both offer generous free tiers without requiring payment information.

---

## Best Practices

1. **Use container platforms** for full MCP support
2. **Enable health checks** for monitoring
3. **Set up Postgres** for production use
4. **Enable backups** in JSON mode
5. **Use environment variables** for configuration
6. **Monitor logs** regularly
7. **Set up alerts** for downtime
8. **Use HTTPS** (automatic on most platforms)
9. **Implement rate limiting** for public deployments
10. **Keep dependencies updated**

---

**Last Updated:** April 2026  
**MemoryLoom Version:** 0.5.0
