# MemoryLoom Editor Setup Guide

Complete configuration guide for connecting MemoryLoom to every major code editor and AI client that supports the Model Context Protocol (MCP).

## Table of Contents

- [Editor Comparison](#editor-comparison)
- [Quick Start](#quick-start)
- [Claude Desktop](#claude-desktop)
- [Cursor IDE](#cursor-ide)
- [VS Code with GitHub Copilot](#vs-code-with-github-copilot)
- [Windsurf IDE](#windsurf-ide)
- [Zed Editor](#zed-editor)
- [Troubleshooting](#troubleshooting)
- [Verification](#verification)

---

## Editor Comparison

Quick comparison of MCP support across editors:

| Editor | MCP Support | Config File | Platform | Setup Difficulty |
|--------|-------------|-------------|----------|------------------|
| **Claude Desktop** | ✅ Native | `claude_desktop_config.json` | macOS, Windows | ⭐ Easy |
| **Cursor** | ✅ Native | `mcp.json` | macOS, Windows, Linux | ⭐ Easy |
| **VS Code** | ✅ Via Copilot | `.vscode/mcp.json` or settings | macOS, Windows, Linux | ⭐⭐ Medium |
| **Windsurf** | ✅ Native (Cascade) | `mcp_config.json` | macOS, Windows, Linux | ⭐ Easy |
| **Zed** | ✅ Native | `settings.json` | macOS, Linux | ⭐ Easy |

### Which Editor Should I Use?

**Choose Claude Desktop if:**
- You want the simplest setup
- You primarily use Claude for AI assistance
- You don't need code editing features

**Choose Cursor if:**
- You want AI-first code editing
- You need both coding and AI chat in one place
- You want project-specific MCP configurations

**Choose VS Code if:**
- You're already using VS Code
- You have a GitHub Copilot subscription
- You want the largest extension ecosystem

**Choose Windsurf if:**
- You want the "Flow" state with Cascade AI
- You prefer Codeium's AI models
- You want a modern, fast editor

**Choose Zed if:**
- You need maximum performance
- You want collaborative editing
- You're on macOS or Linux

---

## Quick Start

Before configuring any editor, ensure MemoryLoom is installed and ready:

```bash
# Clone or download MemoryLoom
git clone https://github.com/bunnysayzz/memoryloom.git
cd memoryloom

# Install dependencies
npm install

# Run setup (creates data directory and config)
npm run setup

# Verify installation
npm run verify
```

**Important:** Note the absolute path to your `server.js` file. You'll need this for editor configuration.

```bash
# Get absolute path (macOS/Linux)
pwd

# Get absolute path (Windows PowerShell)
Get-Location
```

---

## Claude Desktop

Claude Desktop is Anthropic's native application with built-in MCP support.

### Configuration File Location

| Platform | Path |
|----------|------|
| **macOS** | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| **Windows** | `%APPDATA%\Claude\claude_desktop_config.json` |

### Setup Steps

1. **Locate the configuration file:**

   **macOS:**
   ```bash
   open ~/Library/Application\ Support/Claude/
   ```

   **Windows:**
   ```powershell
   explorer %APPDATA%\Claude
   ```

2. **Edit `claude_desktop_config.json`:**

   If the file doesn't exist, create it with this content:

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

   **Replace `/absolute/path/to/memoryloom/server.js`** with your actual path.

3. **Example configurations:**

   **macOS:**
   ```json
   {
     "mcpServers": {
       "memoryloom": {
         "command": "node",
         "args": ["/Users/yourname/projects/memoryloom/server.js"]
       }
     }
   }
   ```

   **Windows:**
   ```json
   {
     "mcpServers": {
       "memoryloom": {
         "command": "node",
         "args": ["C:\\Users\\YourName\\projects\\memoryloom\\server.js"]
       }
     }
   }
   ```

4. **Restart Claude Desktop** to load the new configuration.

5. **Verify the connection:**
   - Open Claude Desktop
   - Look for the 🔨 (hammer) icon in the chat interface
   - Click it to see available MCP tools
   - You should see MemoryLoom tools: `add_memory`, `search_memories`, etc.

### Advanced Configuration

**With environment variables:**

```json
{
  "mcpServers": {
    "memoryloom": {
      "command": "node",
      "args": ["/absolute/path/to/memoryloom/server.js"],
      "env": {
        "MEMORYLOOM_STORAGE_MODE": "json",
        "MEMORYLOOM_LOG_LEVEL": "info",
        "MEMORYLOOM_DATA_DIR": "/path/to/custom/data"
      }
    }
  }
}
```

**With API key protection:**

```json
{
  "mcpServers": {
    "memoryloom": {
      "command": "node",
      "args": ["/absolute/path/to/memoryloom/server.js"],
      "env": {
        "MEMORYLOOM_API_KEY": "your-secret-key-here"
      }
    }
  }
}
```

---

## Cursor IDE

Cursor is an AI-first code editor with native MCP support.

### Configuration File Location

| Platform | Path |
|----------|------|
| **macOS** | `~/.cursor/mcp.json` |
| **Windows** | `%USERPROFILE%\.cursor\mcp.json` |
| **Linux** | `~/.cursor/mcp.json` |

### Setup Steps

1. **Open Cursor Settings:**
   - Press `Cmd+Shift+P` (macOS) or `Ctrl+Shift+P` (Windows/Linux)
   - Type "MCP" and select **"Configure MCP Servers"**
   - Or manually navigate to the config file location

2. **Edit `mcp.json`:**

   If the file doesn't exist, create it:

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

3. **Example configurations:**

   **macOS/Linux:**
   ```json
   {
     "mcpServers": {
       "memoryloom": {
         "command": "node",
         "args": ["/home/yourname/projects/memoryloom/server.js"]
       }
     }
   }
   ```

   **Windows:**
   ```json
   {
     "mcpServers": {
       "memoryloom": {
         "command": "node",
         "args": ["C:\\Users\\YourName\\projects\\memoryloom\\server.js"]
       }
     }
   }
   ```

4. **Reload Cursor:**
   - Press `Cmd+Shift+P` / `Ctrl+Shift+P`
   - Type "Reload Window" and select it
   - Or restart Cursor completely

5. **Verify the connection:**
   - Open Cursor's AI chat panel
   - Look for MCP tools indicator
   - Type a message that would use memory (e.g., "search my memories for...")

### Project-Level Configuration

Cursor also supports **project-specific** MCP configuration:

Create `.cursor/mcp.json` in your project root:

```json
{
  "mcpServers": {
    "memoryloom": {
      "command": "node",
      "args": ["/absolute/path/to/memoryloom/server.js"],
      "env": {
        "MEMORYLOOM_DATA_DIR": "${workspaceFolder}/.memoryloom-data"
      }
    }
  }
}
```

**Note:** Project-level config takes precedence over global config.

---

## VS Code with GitHub Copilot

VS Code supports MCP through the GitHub Copilot extension and MCP Registry.

### Prerequisites

- VS Code version 1.85 or later
- GitHub Copilot subscription (Individual, Business, or Enterprise)
- GitHub Copilot extension installed

### Setup Steps

#### Method 1: Using MCP Registry (Recommended)

1. **Open VS Code Extensions panel:**
   - Press `Ctrl+Shift+X` (Windows/Linux) or `Cmd+Shift+X` (macOS)

2. **Search for MCP servers:**
   - In the search bar, type `@mcp` followed by the server name
   - Or click the filter icon and select **"MCP Registry"**

3. **Install custom MCP server:**
   - Since MemoryLoom is a custom server, you'll need to add it manually
   - Open Command Palette: `Ctrl+Shift+P` / `Cmd+Shift+P`
   - Type "GitHub Copilot: Configure MCP Servers"

4. **Add MemoryLoom configuration:**

   Create or edit `.vscode/mcp.json` in your workspace:

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

#### Method 2: User Settings Configuration

1. **Open VS Code Settings:**
   - Press `Ctrl+,` (Windows/Linux) or `Cmd+,` (macOS)
   - Click the "Open Settings (JSON)" icon in the top right

2. **Add MCP configuration:**

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

3. **Reload VS Code:**
   - Press `Ctrl+Shift+P` / `Cmd+Shift+P`
   - Type "Developer: Reload Window"

### Verification

1. Open GitHub Copilot Chat panel
2. Type `@memoryloom` to see if the server is recognized
3. Try using memory tools through Copilot Chat

### Example Usage in VS Code

```
You: @memoryloom add a memory that I prefer TypeScript over JavaScript

Copilot: [Uses add_memory tool to store this preference]

You: @memoryloom what are my language preferences?

Copilot: [Uses search_memories tool to retrieve preferences]
```

---

## Windsurf IDE

Windsurf (by Codeium) supports MCP through its Cascade AI agent.

### Configuration File Location

| Platform | Path |
|----------|------|
| **macOS** | `~/.codeium/windsurf/mcp_config.json` |
| **Windows** | `%USERPROFILE%\.codeium\windsurf\mcp_config.json` |
| **Linux** | `~/.codeium/windsurf/mcp_config.json` |

### Setup Steps

1. **Open Windsurf MCP Settings:**
   - Press `Cmd+Shift+P` (macOS) or `Ctrl+Shift+P` (Windows/Linux)
   - Type "Windsurf: Configure MCP Servers"
   - Or navigate to: **Settings → Advanced Settings → Cascade → MCP Servers**

2. **Click "View Raw Config"** to open `mcp_config.json`

3. **Add MemoryLoom configuration:**

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

4. **Example configurations:**

   **macOS:**
   ```json
   {
     "mcpServers": {
       "memoryloom": {
         "command": "node",
         "args": ["/Users/yourname/projects/memoryloom/server.js"],
         "env": {
           "MEMORYLOOM_LOG_LEVEL": "info"
         }
       }
     }
   }
   ```

   **Windows:**
   ```json
   {
     "mcpServers": {
       "memoryloom": {
         "command": "node",
         "args": ["C:\\Users\\YourName\\projects\\memoryloom\\server.js"]
       }
     }
   }
   ```

5. **Save and reload:**
   - Save the `mcp_config.json` file
   - Restart Windsurf or reload the window

6. **Verify the connection:**
   - Open Cascade AI panel (sidebar)
   - Click the 🔨 (hammer/MCP) icon
   - You should see MemoryLoom listed with its tools

### Using MemoryLoom in Windsurf

The Cascade agent can now use MemoryLoom tools automatically:

```
You: Remember that I prefer using Tailwind CSS for styling

Cascade: [Uses add_memory to store this preference]

You: What styling preferences do I have?

Cascade: [Uses search_memories to retrieve styling preferences]
```

---

## Zed Editor

Zed is a high-performance, collaborative code editor with MCP support.

### Configuration File Location

| Platform | Path |
|----------|------|
| **macOS** | `~/.config/zed/settings.json` |
| **Linux** | `~/.config/zed/settings.json` |

**Note:** Zed is currently macOS and Linux only.

### Setup Steps

1. **Open Zed Settings:**
   - Press `Cmd+,` (macOS) or `Ctrl+,` (Linux)
   - Or use Command Palette: `Cmd+Shift+P` → "Open Settings"

2. **Switch to JSON view** (if not already in JSON mode)

3. **Add MCP server configuration:**

   Add this to your `settings.json`:

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

4. **Example configuration:**

   **macOS:**
   ```json
   {
     "context_servers": {
       "memoryloom": {
         "command": "node",
         "args": ["/Users/yourname/projects/memoryloom/server.js"],
         "env": {
           "MEMORYLOOM_STORAGE_MODE": "json",
           "MEMORYLOOM_LOG_LEVEL": "info"
         }
       }
     },
     "assistant": {
       "version": "2",
       "default_model": {
         "provider": "anthropic",
         "model": "claude-3-5-sonnet-20241022"
       }
     }
   }
   ```

   **Linux:**
   ```json
   {
     "context_servers": {
       "memoryloom": {
         "command": "node",
         "args": ["/home/yourname/projects/memoryloom/server.js"]
       }
     }
   }
   ```

5. **Reload Zed:**
   - Press `Cmd+Shift+P` / `Ctrl+Shift+P`
   - Type "Reload Window"
   - Or restart Zed

6. **Verify the connection:**
   - Open Zed's AI assistant panel
   - The assistant should now have access to MemoryLoom tools
   - Try asking it to store or retrieve memories

### Project-Specific Configuration

You can also configure MCP servers per-project by creating `.zed/settings.json` in your project root:

```json
{
  "context_servers": {
    "memoryloom": {
      "command": "node",
      "args": ["/absolute/path/to/memoryloom/server.js"],
      "env": {
        "MEMORYLOOM_DATA_DIR": "${ZED_WORKTREE_ROOT}/.memoryloom-data"
      }
    }
  }
}
```

---

## Troubleshooting

### Common Issues

#### 1. "MCP server not found" or "Connection failed"

**Possible causes:**
- Incorrect path to `server.js`
- Node.js not in PATH
- File permissions issue

**Solutions:**
```bash
# Verify Node.js is installed
node --version

# Verify server.js exists and is executable
ls -la /path/to/memoryloom/server.js

# Test server manually
node /path/to/memoryloom/server.js
```

#### 2. "Tools not appearing in editor"

**Solutions:**
- Restart the editor completely (not just reload window)
- Check editor logs for MCP errors
- Verify JSON syntax in config file (use a JSON validator)
- Ensure no trailing commas in JSON

#### 3. "Permission denied" errors

**macOS/Linux:**
```bash
# Make server.js executable
chmod +x /path/to/memoryloom/server.js
```

**Windows:**
- Run editor as Administrator
- Check antivirus isn't blocking Node.js

#### 4. "Module not found" errors

```bash
# Reinstall dependencies
cd /path/to/memoryloom
npm install
```

#### 5. Configuration file not loading

**Claude Desktop:**
```bash
# Verify file location
ls -la ~/Library/Application\ Support/Claude/claude_desktop_config.json

# Check JSON syntax
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json | python -m json.tool
```

**Cursor:**
```bash
# Verify file location
ls -la ~/.cursor/mcp.json

# Check JSON syntax
cat ~/.cursor/mcp.json | python -m json.tool
```

### Debug Mode

Enable debug logging to troubleshoot issues:

```json
{
  "mcpServers": {
    "memoryloom": {
      "command": "node",
      "args": ["/absolute/path/to/memoryloom/server.js"],
      "env": {
        "MEMORYLOOM_LOG_LEVEL": "debug"
      }
    }
  }
}
```

Check logs:
- **Claude Desktop:** Check Console.app (macOS) or Event Viewer (Windows)
- **Cursor/VS Code:** Check Developer Tools Console (`Help → Toggle Developer Tools`)
- **Windsurf:** Check Output panel (`View → Output`)
- **Zed:** Check `~/.local/share/zed/logs/` or `~/Library/Logs/Zed/`

### Editor-Specific Issues

#### Claude Desktop

**Issue:** Config changes not taking effect
- **Solution:** Completely quit Claude Desktop (not just close window) and restart
- **macOS:** Use `Cmd+Q` to fully quit
- **Windows:** Right-click system tray icon and select "Quit"

**Issue:** "Failed to start MCP server"
- **Solution:** Check that Node.js is in your system PATH
  ```bash
  # macOS/Linux
  which node
  
  # Windows
  where node
  ```

#### Cursor

**Issue:** MCP tools not appearing in chat
- **Solution:** 
  1. Check both global (`~/.cursor/mcp.json`) and project (`.cursor/mcp.json`) configs
  2. Project config overrides global config
  3. Reload window: `Cmd/Ctrl+Shift+P` → "Developer: Reload Window"

**Issue:** "Cannot find module" error
- **Solution:** Ensure you're using absolute paths, not relative paths
  ```json
  // ❌ Wrong
  "args": ["./server.js"]
  
  // ✅ Correct
  "args": ["/Users/yourname/memoryloom/server.js"]
  ```

#### VS Code

**Issue:** MCP server not recognized by Copilot
- **Solution:** 
  1. Ensure GitHub Copilot extension is up to date
  2. Check that you have an active Copilot subscription
  3. Reload window after config changes

**Issue:** "@memoryloom not found" in Copilot Chat
- **Solution:** MCP servers may take a few seconds to initialize. Wait 10-15 seconds after reload.

#### Windsurf

**Issue:** Cascade not using MCP tools
- **Solution:**
  1. Open Cascade sidebar
  2. Click the 🔨 (hammer) icon
  3. Verify MemoryLoom is listed and enabled
  4. Toggle it off and on if needed

**Issue:** "MCP server crashed" error
- **Solution:** Check `mcp_config.json` for syntax errors (trailing commas, missing quotes)

#### Zed

**Issue:** Context server not loading
- **Solution:** 
  1. Zed uses `context_servers` key (not `mcpServers`)
  2. Ensure you're editing the correct `settings.json`
  3. Check `~/.config/zed/settings.json` (not VS Code's settings)

**Issue:** "Command not found: node"
- **Solution:** Add Node.js to PATH or use absolute path to node binary
  ```json
  {
    "context_servers": {
      "memoryloom": {
        "command": "/usr/local/bin/node",
        "args": ["/path/to/server.js"]
      }
    }
  }
  ```

### Testing MemoryLoom Directly

Test the server outside of any editor:

```bash
# Run verification script
cd /path/to/memoryloom
npm run verify

# Start server manually and check for errors
node server.js
```

---

## Verification

After configuring your editor, verify MemoryLoom is working:

### Test 1: Add a Memory

Ask your AI assistant:
```
Store a memory that I prefer dark mode for coding
```

Expected: The assistant uses `add_memory` tool successfully.

### Test 2: Search Memories

Ask your AI assistant:
```
What preferences have I stored?
```

Expected: The assistant uses `search_memories` and returns your stored preferences.

### Test 3: Check Server Status

Ask your AI assistant:
```
Check the MemoryLoom server status
```

Expected: The assistant uses `server_status` tool and shows server info.

### Manual Verification

Run the built-in verification script:

```bash
cd /path/to/memoryloom
npm run verify
```

This validates:
- ✅ MCP initialization
- ✅ Tool discovery
- ✅ Memory CRUD operations
- ✅ Search functionality
- ✅ Metadata handling
- ✅ Archive/delete behavior

---

## Environment Variables Reference

Configure MemoryLoom behavior through environment variables in your editor config:

| Variable | Values | Default | Description |
|----------|--------|---------|-------------|
| `MEMORYLOOM_STORAGE_MODE` | `json`, `postgres` | `json` | Storage backend |
| `MEMORYLOOM_DATA_DIR` | Path | `./data` | Data directory for JSON mode |
| `MEMORYLOOM_DATA_FILE` | Path | `./data/memories.json` | Exact JSON file path |
| `MEMORYLOOM_LOG_LEVEL` | `debug`, `info`, `warn`, `error` | `info` | Logging verbosity |
| `MEMORYLOOM_BACKUP_ON_WRITE` | `true`, `false` | `false` | Enable rolling backups |
| `MEMORYLOOM_BACKUP_RETENTION` | Number | `5` | Number of backups to keep |
| `MEMORYLOOM_POSTGRES_URL` | Connection string | - | Postgres database URL |
| `MEMORYLOOM_API_KEY` | String | - | Optional API key for auth |
| `MEMORYLOOM_HEALTH_PORT` | Number (0-65535) | `0` | HTTP health check port |
| `MEMORYLOOM_MAX_TOOL_CALLS_PER_MINUTE` | Number | `0` | Rate limit (0=disabled) |
| `MEMORYLOOM_WEB_UI` | `true`, `false` | `true` | Enable web UI |

### Example with Multiple Variables

```json
{
  "mcpServers": {
    "memoryloom": {
      "command": "node",
      "args": ["/absolute/path/to/memoryloom/server.js"],
      "env": {
        "MEMORYLOOM_STORAGE_MODE": "json",
        "MEMORYLOOM_DATA_DIR": "/Users/yourname/.memoryloom",
        "MEMORYLOOM_LOG_LEVEL": "info",
        "MEMORYLOOM_BACKUP_ON_WRITE": "true",
        "MEMORYLOOM_BACKUP_RETENTION": "10"
      }
    }
  }
}
```

---

## Multiple Editor Setup

You can use MemoryLoom across multiple editors simultaneously. Each editor will connect to the same data store.

### Shared Configuration Example

**Claude Desktop** (`claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "memoryloom": {
      "command": "node",
      "args": ["/Users/yourname/memoryloom/server.js"],
      "env": {
        "MEMORYLOOM_DATA_DIR": "/Users/yourname/.memoryloom-shared"
      }
    }
  }
}
```

**Cursor** (`~/.cursor/mcp.json`):
```json
{
  "mcpServers": {
    "memoryloom": {
      "command": "node",
      "args": ["/Users/yourname/memoryloom/server.js"],
      "env": {
        "MEMORYLOOM_DATA_DIR": "/Users/yourname/.memoryloom-shared"
      }
    }
  }
}
```

**Result:** Both editors share the same memory store at `/Users/yourname/.memoryloom-shared`.

---

## Frequently Asked Questions (FAQ)

### General Questions

**Q: Can I use MemoryLoom with multiple editors at the same time?**

A: Yes! You can configure MemoryLoom in multiple editors simultaneously. They'll all share the same memory store if you point them to the same `MEMORYLOOM_DATA_DIR`.

**Q: Do I need a paid subscription to use MemoryLoom?**

A: MemoryLoom itself is free and open source. However, some editors require subscriptions:
- Claude Desktop: Free or paid Claude subscription
- Cursor: Free trial, then paid subscription
- VS Code: Requires GitHub Copilot subscription (paid)
- Windsurf: Free with Codeium
- Zed: Free

**Q: Which storage mode should I use?**

A: 
- **JSON mode**: Best for personal use, local development, simple setup
- **Postgres mode**: Best for teams, production deployments, high concurrency

**Q: How much memory can MemoryLoom store?**

A: There's no hard limit. JSON mode is practical up to ~10,000 memories. For larger datasets, use Postgres mode.

**Q: Is my data secure?**

A: Yes. MemoryLoom runs locally on your machine. Data never leaves your computer unless you explicitly deploy it to a remote server. You can also enable API key authentication.

### Configuration Questions

**Q: What's the difference between global and project-level config?**

A: 
- **Global config**: Applies to all projects (e.g., `~/.cursor/mcp.json`)
- **Project config**: Applies only to specific project (e.g., `.cursor/mcp.json` in project root)
- Project config takes precedence when both exist

**Q: Can I use environment variables in config paths?**

A: Some editors support this:
- Cursor: Limited support
- Windsurf: Limited support  
- Zed: Supports `${ZED_WORKTREE_ROOT}`
- VS Code: Supports `${workspaceFolder}`

**Q: How do I use a custom data directory?**

A: Set the `MEMORYLOOM_DATA_DIR` environment variable:

```json
{
  "mcpServers": {
    "memoryloom": {
      "command": "node",
      "args": ["/path/to/server.js"],
      "env": {
        "MEMORYLOOM_DATA_DIR": "/custom/path/to/data"
      }
    }
  }
}
```

### Troubleshooting Questions

**Q: Why aren't my config changes taking effect?**

A: Try these steps in order:
1. Save the config file
2. Reload the editor window
3. Completely quit and restart the editor
4. Check for JSON syntax errors
5. Verify the config file path is correct

**Q: How do I know if MemoryLoom is running?**

A: Ask your AI assistant to check server status:
```
Check the MemoryLoom server status
```

Or run the verification script:
```bash
npm run verify
```

**Q: The server starts but tools don't appear. What's wrong?**

A: Common causes:
1. Editor doesn't support MCP (check editor version)
2. Config file in wrong location
3. JSON syntax error in config
4. Need to restart editor (not just reload)
5. MCP feature not enabled in editor settings

**Q: Can I run multiple MemoryLoom instances?**

A: Yes, but each needs a different data directory:

```json
{
  "mcpServers": {
    "memoryloom-personal": {
      "command": "node",
      "args": ["/path/to/server.js"],
      "env": {
        "MEMORYLOOM_DATA_DIR": "/path/to/personal-data"
      }
    },
    "memoryloom-work": {
      "command": "node",
      "args": ["/path/to/server.js"],
      "env": {
        "MEMORYLOOM_DATA_DIR": "/path/to/work-data"
      }
    }
  }
}
```

### Usage Questions

**Q: How do I migrate from JSON to Postgres mode?**

A: 
1. Export your JSON data
2. Set up Postgres database
3. Update config to use Postgres mode
4. Import your data using the API

**Q: Can I backup my memories?**

A: Yes! 
- **JSON mode**: Enable automatic backups with `MEMORYLOOM_BACKUP_ON_WRITE=true`
- **Postgres mode**: Use standard database backup tools
- **Manual**: Copy the `data/memories.json` file

**Q: How do I share memories with my team?**

A: Deploy MemoryLoom to a server and configure all team members to connect to it. See [deployment options](README.md#deployment-files).

**Q: Can I import/export memories?**

A: Yes. Memories are stored in JSON format. You can:
- Copy `data/memories.json` between machines
- Use the API to bulk import/export
- Write custom scripts using the MCP tools

**Q: What happens if two editors modify the same memory?**

A: The last write wins. MemoryLoom uses atomic writes to prevent corruption, but doesn't have conflict resolution. For team use, consider using Postgres mode with proper access controls.

### Performance Questions

**Q: Will MemoryLoom slow down my editor?**

A: No. MemoryLoom runs as a separate process and only activates when you use memory tools. It has minimal impact on editor performance.

**Q: How fast is memory search?**

A: Very fast for typical use:
- JSON mode: ~1-5ms for <1000 memories
- Postgres mode: ~5-20ms depending on database

**Q: Can I optimize search performance?**

A: Yes:
1. Use metadata filters to narrow search scope
2. Keep memory content concise
3. Archive old/unused memories
4. Use Postgres mode for large datasets
5. Add database indexes (Postgres mode)

### Advanced Questions

**Q: Can I use MemoryLoom with custom AI models?**

A: Yes, if your editor supports MCP with custom models. MemoryLoom is model-agnostic.

**Q: Can I extend MemoryLoom with custom tools?**

A: Yes! MemoryLoom is open source. You can fork it and add custom tools. See `server.js` for tool definitions.

**Q: Does MemoryLoom support embeddings?**

A: Yes! MemoryLoom generates local embeddings (64-dimensional vectors) for semantic search. No external API required.

**Q: Can I use MemoryLoom for RAG (Retrieval-Augmented Generation)?**

A: Absolutely! That's exactly what it's designed for. Store context, retrieve relevant memories, and inject them into AI prompts.

**Q: Is there a web interface?**

A: Yes! MemoryLoom includes an optional web UI. Enable it with `MEMORYLOOM_HEALTH_PORT`:

```json
{
  "env": {
    "MEMORYLOOM_HEALTH_PORT": "8080"
  }
}
```

Then visit `http://localhost:8080` for the landing page and health endpoints.

---

## Next Steps

- Read the [main README](README.md) for feature details
- Check [MemoryLoom_Documentation.txt](MemoryLoom_Documentation.txt) for API reference
- Explore [deployment options](README.md#deployment-files) for production use
- Join the community and share your setup!

---

## Support

If you encounter issues:

1. Check the **[Troubleshooting Guide](TROUBLESHOOTING.md)** for detailed solutions
2. Run `npm run verify` to test the server
3. Enable debug logging (`MEMORYLOOM_LOG_LEVEL=debug`)
4. Review [editor-specific issues](TROUBLESHOOTING.md#editor-specific-issues)
5. Open an issue on [GitHub](https://github.com/bunnysayzz/memoryloom/issues)

---

**Last Updated:** April 2026  
**MemoryLoom Version:** 0.5.0  
**MCP Protocol Version:** 2024-11-05
