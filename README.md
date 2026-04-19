# MemoryLoom

MemoryLoom is an MCP-compatible memory server for editors, IDEs, and AI clients. It provides persistent memory with a clean tool interface, metadata-aware retrieval, and pluggable storage backends.

[![CI](https://github.com/bunnysayzz/memoryloom/actions/workflows/ci.yml/badge.svg)](https://github.com/bunnysayzz/memoryloom/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## 🚀 One-Click Deploy

### 🆓 Truly Free (No Credit Card Required)

**[📖 No Credit Card Deployment Guide](NO_CREDIT_CARD_DEPLOY.md)** - Detailed instructions for Railway & Fly.io

[![Deploy to Railway](https://img.shields.io/badge/Deploy-Railway-0B0D0E?logo=railway&logoColor=white)](https://railway.app/new/template?template=https://github.com/bunnysayzz/memoryloom)
[![Deploy to Fly.io](https://img.shields.io/badge/Deploy-Fly.io-8B5CF6?logo=flydotio&logoColor=white)](https://fly.io/docs/launch/deploy/)
[![Deploy to Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel&logoColor=white)](https://vercel.com/new/clone?repository-url=https://github.com/bunnysayzz/memoryloom)
[![Deploy to Netlify](https://img.shields.io/badge/Deploy-Netlify-00C7B7?logo=netlify&logoColor=white)](https://app.netlify.com/start/deploy?repository=https://github.com/bunnysayzz/memoryloom)

### 💳 Free Tier (Credit Card Required for Verification)

[![Deploy to Heroku](https://img.shields.io/badge/Deploy-Heroku-430098?logo=heroku&logoColor=white)](https://heroku.com/deploy?template=https://github.com/bunnysayzz/memoryloom)
[![Deploy to Render](https://img.shields.io/badge/Deploy-Render-46E3B7?logo=render&logoColor=black)](https://render.com/deploy?repo=https://github.com/bunnysayzz/memoryloom)
[![Deploy to Koyeb](https://img.shields.io/badge/Deploy-Koyeb-121212?logo=koyeb&logoColor=white)](https://app.koyeb.com/deploy?type=git&repository=https://github.com/bunnysayzz/memoryloom)

### 💰 Paid Platforms

[![Deploy to DigitalOcean](https://img.shields.io/badge/Deploy-DigitalOcean-0080FF?logo=digitalocean&logoColor=white)](https://cloud.digitalocean.com/apps/new?repo=https://github.com/bunnysayzz/memoryloom/tree/main)
[![Deploy to Google Cloud](https://img.shields.io/badge/Deploy-Google%20Cloud-4285F4?logo=googlecloud&logoColor=white)](https://console.cloud.google.com/cloudshell/editor?cloudshell_git_repo=https://github.com/bunnysayzz/memoryloom)
[![Deploy to Azure](https://img.shields.io/badge/Deploy-Azure-0078D4?logo=microsoftazure&logoColor=white)](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2Fbunnysayzz%2Fmemoryloom%2Fmain%2Fazure-deploy.json)

**💡 Recommendation:** Start with **Railway** or **Fly.io** for truly free deployment without credit card. For full MCP support, avoid serverless platforms (Vercel, Netlify).

---

## 📚 Documentation

**[📑 Complete Documentation Index](DOCUMENTATION_INDEX.md)** - Navigate all documentation

- **[Editor Setup Guide](EDITOR_SETUP.md)** - Step-by-step configuration for Claude Desktop, Cursor, VS Code, Windsurf, and Zed
- **[Deployment Guide](DEPLOYMENT_GUIDE.md)** - Deploy to 10+ platforms with one-click or manual setup
- **[No Credit Card Deploy](NO_CREDIT_CARD_DEPLOY.md)** - Deploy to Railway or Fly.io without credit card
- **[Quick Reference Card](QUICK_REFERENCE.md)** - Printable cheat sheet with config locations, commands, and troubleshooting
- **[Troubleshooting Guide](TROUBLESHOOTING.md)** - Comprehensive solutions for common issues across all editors
- **[Migration Guide](MIGRATION_GUIDE.md)** - Migrate from other memory servers, switch storage modes, team setup
- **API Documentation** (MemoryLoom_Documentation.txt) - Complete API reference, tool schemas, and usage examples
- **[Quick Start](#quick-start)** - Get running in 2 minutes

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    MCP-Compatible Editors                    │
│  Claude Desktop │ Cursor │ VS Code │ Windsurf │ Zed         │
└────────────────────────┬────────────────────────────────────┘
                         │ MCP Protocol (stdio)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      MemoryLoom Server                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Tool Handler │  │ Search Engine│  │ Auth & Rate  │      │
│  │ (10 tools)   │  │ (Hybrid)     │  │ Limiting     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Storage Layer (Pluggable)                 │
│  ┌──────────────────────┐    ┌──────────────────────┐       │
│  │   JSON Store         │    │   Postgres Store     │       │
│  │ • File-backed        │    │ • Database-backed    │       │
│  │ • Atomic writes      │    │ • Transactional      │       │
│  │ • Rolling backups    │    │ • Scalable           │       │
│  └──────────────────────┘    └──────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

## Features

- MCP server over stdio in `server.js`
- Memory lifecycle tools:
  - `add_memory`
  - `search_memories`
  - `get_memories`
  - `list_memories`
  - `update_memory`
  - `delete_memory`
  - `memory_stats`
  - `server_status`
  - `upsert_memory`
  - `consolidate_memories`
- Hybrid ranking with token overlap + embedding similarity + metadata weighting
- Rich memory metadata for filtering and governance

## ⚠️ Embedding Limitations

MemoryLoom uses a **toy-grade character n-gram hashing** implementation for embedding similarity, not a production-grade vector embedding model like OpenAI embeddings or sentence-transformers. This is a lightweight, dependency-free approach suitable for:

- Small to medium memory sets (< 10,000 memories)
- Simple semantic matching based on character patterns
- Zero external dependencies and API keys
- Fast local computation

**Limitations:**
- Not a true semantic embedding (no word context understanding)
- Performance degrades with larger memory sets
- May not capture complex semantic relationships
- Character-based matching can miss synonyms or related concepts

For production use with large memory sets or advanced semantic understanding, consider integrating a proper vector embedding service (e.g., OpenAI embeddings, sentence-transformers) and a vector database.
- Pluggable storage:
  - `json` mode (local file-backed)
  - `postgres` mode (database-backed)
- Runtime configuration via environment variables
- Optional API-key protection for MCP tool calls
- Optional health/readiness HTTP endpoints for deployment platforms
- Optional hosted web UI on `/` (modern animated responsive landing page)
- Atomic writes and optional rolling backups in JSON mode
- Docker + Compose deployment support
- End-to-end verification script

## Quick Start

```bash
npm install
npm run setup
npm run verify
npm start
```

## Editor Setup

MemoryLoom works with all major MCP-compatible editors and AI clients:

- **[Claude Desktop](EDITOR_SETUP.md#claude-desktop)** - Anthropic's native app
- **[Cursor IDE](EDITOR_SETUP.md#cursor-ide)** - AI-first code editor
- **[VS Code + GitHub Copilot](EDITOR_SETUP.md#vs-code-with-github-copilot)** - Microsoft's editor with Copilot
- **[Windsurf IDE](EDITOR_SETUP.md#windsurf-ide)** - Codeium's Cascade AI editor
- **[Zed Editor](EDITOR_SETUP.md#zed-editor)** - High-performance collaborative editor

**📖 [Complete Editor Setup Guide →](EDITOR_SETUP.md)**

### Quick Configuration Example

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

See [EDITOR_SETUP.md](EDITOR_SETUP.md) for detailed instructions for your specific editor.

## Runtime Configuration

Environment variables:

- `MEMORYLOOM_STORAGE_MODE`: `json` or `postgres`
- `MEMORYLOOM_DATA_DIR`: base directory for local storage
- `MEMORYLOOM_DATA_FILE`: exact JSON file path (JSON mode)
- `MEMORYLOOM_LOG_LEVEL`: `debug`, `info`, `warn`, `error`
- `MEMORYLOOM_BACKUP_ON_WRITE`: `true` or `false`
- `MEMORYLOOM_BACKUP_RETENTION`: number of backup snapshots retained
- `MEMORYLOOM_POSTGRES_URL`: Postgres connection string for `postgres` mode
- `MEMORYLOOM_API_KEY`: optional API key required for all tool calls
- `MEMORYLOOM_HEALTH_PORT`: optional HTTP port exposing `/health` and `/ready`
- `MEMORYLOOM_MAX_TOOL_CALLS_PER_MINUTE`: optional global per-minute tool call limit (`0` disables)
- `MEMORYLOOM_WEB_UI`: set to `false` to disable hosted web UI routes

Reference defaults:
- `.env.example`

## Storage Modes

### JSON Mode

```bash
export MEMORYLOOM_STORAGE_MODE=json
npm start
```

### Postgres Mode

```bash
export MEMORYLOOM_STORAGE_MODE=postgres
export MEMORYLOOM_POSTGRES_URL=postgres://postgres:postgres@localhost:5432/memoryloom
npm start
```

On startup in Postgres mode, MemoryLoom auto-creates the `memoryloom_memories` table if it does not exist.

### Health Endpoints

```bash
export MEMORYLOOM_HEALTH_PORT=8080
npm start
```

Endpoints:
- `GET /health`
- `GET /ready`
- `GET /` (web UI, when `MEMORYLOOM_WEB_UI` is not `false`)

## Tool Payloads

### `add_memory`

```json
{
  "api_key": "your-api-key-if-enabled",
  "content": "User prefers concise technical responses with examples.",
  "importance": 0.95,
  "metadata": {
    "user": "u-1042",
    "project": "memoryloom",
    "memory_type": "preference",
    "tags": ["style", "format"],
    "confidence": 0.99
  }
}
```

### `search_memories`

```json
{
  "api_key": "your-api-key-if-enabled",
  "query": "response style preference",
  "filters": {
    "user": "u-1042",
    "project": "memoryloom",
    "memory_type": "preference"
  },
  "limit": 5
}
```

### `update_memory`

```json
{
  "api_key": "your-api-key-if-enabled",
  "id": "memory-id",
  "content": "Updated memory content",
  "metadata": {
    "tags": ["updated"],
    "confidence": 0.98
  }
}
```

### `delete_memory`

```json
{
  "api_key": "your-api-key-if-enabled",
  "id": "memory-id",
  "hard_delete": false
}
```

### `memory_stats`

```json
{
  "api_key": "your-api-key-if-enabled"
}
```

### `server_status`

```json
{
  "api_key": "your-api-key-if-enabled"
}
```

### `upsert_memory`

```json
{
  "api_key": "your-api-key-if-enabled",
  "content": "The latest user preference statement",
  "metadata": {
    "user": "u-1042",
    "project": "memoryloom",
    "memory_type": "preference",
    "tags": ["style"]
  }
}
```

### `consolidate_memories`

```json
{
  "api_key": "your-api-key-if-enabled",
  "minimum_count": 3,
  "archive_originals": true,
  "filters": {
    "project": "memoryloom",
    "memory_type": "note"
  }
}
```

## Deployment Files

### Container Platforms
- `Dockerfile` - Docker container configuration
- `docker-compose.yml` - Docker Compose for local development
- `app.json` - Heroku app manifest
- `render.yaml` - Render blueprint
- `railway.json` - Railway configuration
- `fly.toml` - Fly.io app configuration
- `.do/app.yaml` - DigitalOcean App Platform configuration
- `Procfile` - Process file for Heroku/similar platforms

### Cloud Platforms
- `cloudbuild.yaml` - Google Cloud Build & Cloud Run
- `azure-pipelines.yml` - Azure Container Apps deployment

### Serverless Platforms (Limited MCP Support)
- `vercel.json` - Vercel configuration
- `netlify.toml` - Netlify configuration
- `netlify/functions/api.js` - Netlify Functions wrapper

**Recommended:** Use container platforms (Heroku, Render, Railway, Fly.io, Koyeb, DigitalOcean) for full MCP stdio support.

## Verification

Run:

```bash
npm run verify
```

This validates MCP initialization, tool discovery, add/search/update/list/get flows, archive + hard delete behavior, metadata/timestamp behavior, embeddings, and status/stats responses.

---

## 🚀 Getting Started Checklist

New to MemoryLoom? Follow this checklist:

- [ ] **Install MemoryLoom**
  ```bash
  git clone https://github.com/bunnysayzz/memoryloom.git
  cd memoryloom
  npm install
  npm run setup
  ```

- [ ] **Choose your editor** - See [Editor Comparison](EDITOR_SETUP.md#editor-comparison)

- [ ] **Configure your editor** - Follow the guide for your editor:
  - [Claude Desktop](EDITOR_SETUP.md#claude-desktop)
  - [Cursor](EDITOR_SETUP.md#cursor-ide)
  - [VS Code](EDITOR_SETUP.md#vs-code-with-github-copilot)
  - [Windsurf](EDITOR_SETUP.md#windsurf-ide)
  - [Zed](EDITOR_SETUP.md#zed-editor)

- [ ] **Verify installation**
  ```bash
  npm run verify
  ```

- [ ] **Test in your editor**
  - Ask your AI: "Store a memory that I prefer dark mode"
  - Ask your AI: "What preferences have I stored?"

- [ ] **Bookmark the [Quick Reference](QUICK_REFERENCE.md)** for easy access

- [ ] **Optional: Set up backups**
  ```json
  {
    "env": {
      "MEMORYLOOM_BACKUP_ON_WRITE": "true",
      "MEMORYLOOM_BACKUP_RETENTION": "10"
    }
  }
  ```

---

## 💡 Usage Examples

### Store User Preferences

```
You: Remember that I prefer TypeScript over JavaScript for new projects

AI: [Uses add_memory tool]
✓ Stored: "User prefers TypeScript over JavaScript for new projects"
```

### Retrieve Context

```
You: What are my programming language preferences?

AI: [Uses search_memories tool]
Based on your memories, you prefer:
- TypeScript over JavaScript for new projects
- Python for data analysis
- Go for backend services
```

### Project-Specific Memory

```
You: For the "acme-app" project, remember we're using PostgreSQL and Redis

AI: [Uses add_memory with project metadata]
✓ Stored with project: acme-app
```

### Search by Project

```
You: What tech stack are we using for acme-app?

AI: [Uses search_memories with project filter]
For acme-app, you're using:
- Database: PostgreSQL
- Cache: Redis
- Framework: Next.js
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🔗 Links

- **GitHub:** [github.com/bunnysayzz/memoryloom](https://github.com/bunnysayzz/memoryloom)
- **Issues:** [Report a bug or request a feature](https://github.com/bunnysayzz/memoryloom/issues)
- **MCP Protocol:** [Model Context Protocol Specification](https://modelcontextprotocol.io)

---

**Built with ❤️ for the MCP community**
