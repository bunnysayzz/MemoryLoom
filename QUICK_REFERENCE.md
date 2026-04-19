# MemoryLoom Quick Reference Card

## 🚀 Installation

```bash
git clone https://github.com/bunnysayzz/memoryloom.git
cd memoryloom
npm install
npm run setup
npm run verify
```

## 📍 Config File Locations

| Editor | Config File Path |
|--------|------------------|
| **Claude Desktop (macOS)** | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| **Claude Desktop (Windows)** | `%APPDATA%\Claude\claude_desktop_config.json` |
| **Cursor (macOS/Linux)** | `~/.cursor/mcp.json` |
| **Cursor (Windows)** | `%USERPROFILE%\.cursor\mcp.json` |
| **VS Code** | `.vscode/mcp.json` or User Settings |
| **Windsurf (macOS/Linux)** | `~/.codeium/windsurf/mcp_config.json` |
| **Windsurf (Windows)** | `%USERPROFILE%\.codeium\windsurf\mcp_config.json` |
| **Zed (macOS/Linux)** | `~/.config/zed/settings.json` |

## ⚙️ Basic Configuration

### Claude Desktop / Cursor / Windsurf

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

### Zed Editor

```json
{
  "context_servers": {
    "memoryloom": {
      "command": "node",
      "args": ["/absolute/path/to/memoryloom/server.js"]
    }
  }
}
```

### VS Code (settings.json)

```json
{
  "github.copilot.mcp.servers": {
    "memoryloom": {
      "command": "node",
      "args": ["/absolute/path/to/memoryloom/server.js"]
    }
  }
}
```

## 🛠️ Available Tools

| Tool | Purpose |
|------|---------|
| `add_memory` | Store a new memory |
| `search_memories` | Search memories by query |
| `get_memories` | Fetch memories by ID |
| `list_memories` | List all memories with filters |
| `update_memory` | Update existing memory |
| `delete_memory` | Archive or delete memory |
| `upsert_memory` | Create or update by conflict key |
| `consolidate_memories` | Merge multiple memories |
| `memory_stats` | Get memory statistics |
| `server_status` | Check server status |

## 🔧 Environment Variables

```json
{
  "mcpServers": {
    "memoryloom": {
      "command": "node",
      "args": ["/path/to/server.js"],
      "env": {
        "MEMORYLOOM_STORAGE_MODE": "json",
        "MEMORYLOOM_DATA_DIR": "/path/to/data",
        "MEMORYLOOM_LOG_LEVEL": "info",
        "MEMORYLOOM_BACKUP_ON_WRITE": "true",
        "MEMORYLOOM_API_KEY": "optional-secret-key"
      }
    }
  }
}
```

## 📝 Common Usage Examples

### Store a Memory

```
Store a memory that I prefer TypeScript over JavaScript for new projects
```

### Search Memories

```
What are my programming language preferences?
```

### List Recent Memories

```
Show me my 10 most recent memories
```

### Get Memory Stats

```
How many memories do I have stored?
```

## 🐛 Troubleshooting

### Server Not Found

```bash
# Verify Node.js
node --version

# Test server manually
node /path/to/memoryloom/server.js

# Check absolute path
pwd  # macOS/Linux
Get-Location  # Windows PowerShell
```

### Config Not Loading

```bash
# Validate JSON syntax
cat config.json | python -m json.tool

# Check file exists
ls -la /path/to/config.json
```

### Enable Debug Logging

```json
{
  "env": {
    "MEMORYLOOM_LOG_LEVEL": "debug"
  }
}
```

## ✅ Verification

```bash
# Run built-in tests
npm run verify

# Check server status
npm start
```

## 🔗 Links

- **[Full Editor Setup Guide](EDITOR_SETUP.md)**
- **[API Documentation](MemoryLoom_Documentation.txt)**
- **[GitHub Repository](https://github.com/bunnysayzz/memoryloom)**

---

**Print this page for quick reference!**
