# MemoryLoom Troubleshooting Guide

Comprehensive troubleshooting guide for common MemoryLoom issues across all editors.

## Table of Contents

- [Quick Diagnostics](#quick-diagnostics)
- [Installation Issues](#installation-issues)
- [Configuration Issues](#configuration-issues)
- [Connection Issues](#connection-issues)
- [Runtime Issues](#runtime-issues)
- [Performance Issues](#performance-issues)
- [Data Issues](#data-issues)
- [Editor-Specific Issues](#editor-specific-issues)
- [Advanced Debugging](#advanced-debugging)

---

## Quick Diagnostics

Run these commands first to identify the issue:

```bash
# 1. Verify Node.js installation
node --version
# Expected: v18.0.0 or higher

# 2. Verify MemoryLoom installation
cd /path/to/memoryloom
npm list
# Should show pg@^8.13.1

# 3. Test server directly
node server.js
# Should start without errors (Ctrl+C to stop)

# 4. Run verification script
npm run verify
# Should pass all tests

# 5. Check data directory
ls -la data/
# Should show memories.json
```

If all these pass, the issue is likely in your editor configuration.

---

## Installation Issues

### Issue: `npm install` fails

**Symptoms:**
```
npm ERR! code ENOENT
npm ERR! syscall open
```

**Solutions:**

1. **Check Node.js version:**
   ```bash
   node --version
   # Must be v18.0.0 or higher
   ```

2. **Update npm:**
   ```bash
   npm install -g npm@latest
   ```

3. **Clear npm cache:**
   ```bash
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **Check permissions:**
   ```bash
   # macOS/Linux
   sudo chown -R $(whoami) ~/.npm
   sudo chown -R $(whoami) /path/to/memoryloom
   ```

### Issue: `npm run setup` fails

**Symptoms:**
```
Error: EACCES: permission denied, mkdir '/path/to/data'
```

**Solutions:**

1. **Fix directory permissions:**
   ```bash
   chmod 755 /path/to/memoryloom
   mkdir -p data
   chmod 755 data
   ```

2. **Run with correct user:**
   ```bash
   # Don't use sudo
   npm run setup
   ```

### Issue: `npm run verify` fails

**Symptoms:**
```
Error: Cannot find module 'pg'
```

**Solutions:**

1. **Reinstall dependencies:**
   ```bash
   rm -rf node_modules
   npm install
   ```

2. **Check package.json:**
   ```bash
   cat package.json
   # Should include "pg": "^8.13.1"
   ```

---

## Configuration Issues

### Issue: Config file not found

**Symptoms:**
- Editor doesn't show MCP tools
- No error messages

**Solutions:**

1. **Verify config file location:**

   ```bash
   # Claude Desktop (macOS)
   ls -la ~/Library/Application\ Support/Claude/claude_desktop_config.json
   
   # Cursor (macOS)
   ls -la ~/.cursor/mcp.json
   
   # Windsurf (macOS)
   ls -la ~/.codeium/windsurf/mcp_config.json
   
   # Zed (macOS)
   ls -la ~/.config/zed/settings.json
   ```

2. **Create config file if missing:**

   ```bash
   # Claude Desktop (macOS)
   mkdir -p ~/Library/Application\ Support/Claude
   touch ~/Library/Application\ Support/Claude/claude_desktop_config.json
   
   # Cursor (macOS)
   mkdir -p ~/.cursor
   touch ~/.cursor/mcp.json
   ```

### Issue: JSON syntax error

**Symptoms:**
```
SyntaxError: Unexpected token } in JSON
```

**Solutions:**

1. **Validate JSON syntax:**
   ```bash
   # macOS/Linux
   cat config.json | python3 -m json.tool
   
   # Or use online validator: jsonlint.com
   ```

2. **Common JSON errors:**

   ```json
   // ❌ Wrong: Trailing comma
   {
     "mcpServers": {
       "memoryloom": {
         "command": "node",
       }
     }
   }
   
   // ✅ Correct: No trailing comma
   {
     "mcpServers": {
       "memoryloom": {
         "command": "node"
       }
     }
   }
   ```

   ```json
   // ❌ Wrong: Comments not allowed
   {
     // This is a comment
     "mcpServers": {}
   }
   
   // ✅ Correct: No comments
   {
     "mcpServers": {}
   }
   ```

### Issue: Absolute path not working

**Symptoms:**
```
Error: Cannot find module '/path/to/server.js'
```

**Solutions:**

1. **Get absolute path:**
   ```bash
   # macOS/Linux
   cd /path/to/memoryloom
   pwd
   # Copy the full path shown
   
   # Windows PowerShell
   cd C:\path\to\memoryloom
   Get-Location
   # Copy the full path shown
   ```

2. **Verify file exists:**
   ```bash
   ls -la /absolute/path/to/memoryloom/server.js
   # Should show the file
   ```

3. **Use correct path format:**

   **macOS/Linux:**
   ```json
   {
     "args": ["/Users/yourname/projects/memoryloom/server.js"]
   }
   ```

   **Windows:**
   ```json
   {
     "args": ["C:\\Users\\YourName\\projects\\memoryloom\\server.js"]
   }
   ```

   Note: Use double backslashes `\\` in Windows paths.

---

## Connection Issues

### Issue: "MCP server not found"

**Symptoms:**
- Editor shows "MCP server not found" error
- Tools don't appear in editor

**Solutions:**

1. **Verify Node.js is in PATH:**
   ```bash
   which node  # macOS/Linux
   where node  # Windows
   
   # Should show path like /usr/local/bin/node
   ```

2. **Use absolute path to node:**
   ```json
   {
     "mcpServers": {
       "memoryloom": {
         "command": "/usr/local/bin/node",
         "args": ["/path/to/server.js"]
       }
     }
   }
   ```

3. **Test server manually:**
   ```bash
   node /path/to/memoryloom/server.js
   # Should start without errors
   ```

### Issue: "Connection refused" or "Connection timeout"

**Symptoms:**
- Editor can't connect to MemoryLoom
- Timeout errors in logs

**Solutions:**

1. **Check if server is running:**
   ```bash
   ps aux | grep server.js
   # Should show node process
   ```

2. **Check for port conflicts:**
   ```bash
   # If using health port
   lsof -i :8080
   # Should show memoryloom or be empty
   ```

3. **Restart editor completely:**
   - Don't just reload window
   - Fully quit and restart the application

### Issue: "Failed to initialize MCP server"

**Symptoms:**
```
Error: Failed to initialize MCP server: memoryloom
```

**Solutions:**

1. **Check server logs:**
   ```bash
   # Enable debug logging
   MEMORYLOOM_LOG_LEVEL=debug node server.js
   ```

2. **Verify dependencies:**
   ```bash
   cd /path/to/memoryloom
   npm list pg
   # Should show pg@8.13.1 or similar
   ```

3. **Check file permissions:**
   ```bash
   chmod +x server.js
   chmod 755 data/
   ```

---

## Runtime Issues

### Issue: Tools not appearing in editor

**Symptoms:**
- Server connects but tools don't show
- No MCP icon in editor

**Solutions:**

1. **Restart editor completely:**
   - Quit application (Cmd+Q on macOS)
   - Wait 5 seconds
   - Restart application

2. **Check MCP support:**
   - Verify editor version supports MCP
   - Update editor to latest version

3. **Check tool visibility:**
   ```bash
   # Test tool discovery
   echo '{"method":"tools/list"}' | node server.js
   # Should return list of tools
   ```

### Issue: "Rate limit exceeded"

**Symptoms:**
```
Error: Rate limit exceeded for tool calls
```

**Solutions:**

1. **Increase rate limit:**
   ```json
   {
     "env": {
       "MEMORYLOOM_MAX_TOOL_CALLS_PER_MINUTE": "100"
     }
   }
   ```

2. **Disable rate limiting:**
   ```json
   {
     "env": {
       "MEMORYLOOM_MAX_TOOL_CALLS_PER_MINUTE": "0"
     }
   }
   ```

### Issue: "Unauthorized tool call"

**Symptoms:**
```
Error: Unauthorized tool call: invalid or missing api_key
```

**Solutions:**

1. **Check API key configuration:**
   ```json
   {
     "env": {
       "MEMORYLOOM_API_KEY": "your-secret-key"
     }
   }
   ```

2. **Remove API key requirement:**
   ```json
   {
     "env": {
       // Remove or comment out MEMORYLOOM_API_KEY
     }
   }
   ```

### Issue: Memory not persisting

**Symptoms:**
- Memories disappear after restart
- Changes not saved

**Solutions:**

1. **Check data directory:**
   ```bash
   ls -la data/memories.json
   # Should exist and be writable
   ```

2. **Check file permissions:**
   ```bash
   chmod 644 data/memories.json
   chmod 755 data/
   ```

3. **Verify storage mode:**
   ```bash
   # Check if using correct storage
   cat data/memories.json
   # Should show JSON with memories array
   ```

4. **Check disk space:**
   ```bash
   df -h
   # Ensure sufficient space available
   ```

---

## Performance Issues

### Issue: Slow search performance

**Symptoms:**
- Search takes >5 seconds
- Editor becomes unresponsive

**Solutions:**

1. **Use metadata filters:**
   ```javascript
   // Instead of broad search
   search_memories({ query: "preference" })
   
   // Use filters
   search_memories({
     query: "preference",
     filters: {
       user: "alice",
       project: "my-project"
     }
   })
   ```

2. **Archive old memories:**
   ```javascript
   // Archive memories you don't need
   delete_memory({
     id: "old-memory-id",
     hard_delete: false  // Archives instead of deleting
   })
   ```

3. **Switch to Postgres mode:**
   ```json
   {
     "env": {
       "MEMORYLOOM_STORAGE_MODE": "postgres",
       "MEMORYLOOM_POSTGRES_URL": "postgres://..."
     }
   }
   ```

### Issue: High memory usage

**Symptoms:**
- Node process using >500MB RAM
- System slowdown

**Solutions:**

1. **Check memory count:**
   ```bash
   # Count memories
   cat data/memories.json | grep '"id"' | wc -l
   ```

2. **Reduce memory size:**
   - Keep memory content concise
   - Archive old memories
   - Use Postgres mode for large datasets

3. **Restart server periodically:**
   - Restart editor to restart MCP server
   - Clears any memory leaks

---

## Data Issues

### Issue: Corrupted memories.json

**Symptoms:**
```
SyntaxError: Unexpected token in JSON
Error: Cannot parse memories.json
```

**Solutions:**

1. **Restore from backup:**
   ```bash
   # Check for backups
   ls -la data/backups/
   
   # Restore latest backup
   cp data/backups/memories-*.json data/memories.json
   ```

2. **Validate and fix JSON:**
   ```bash
   # Try to parse
   cat data/memories.json | python3 -m json.tool > data/memories-fixed.json
   mv data/memories-fixed.json data/memories.json
   ```

3. **Start fresh (last resort):**
   ```bash
   # Backup corrupted file
   mv data/memories.json data/memories-corrupted.json
   
   # Create new empty file
   echo '{"memories":[]}' > data/memories.json
   ```

### Issue: Duplicate memories

**Symptoms:**
- Same memory appears multiple times
- Search returns duplicates

**Solutions:**

1. **Use upsert instead of add:**
   ```javascript
   // Instead of add_memory
   upsert_memory({
     content: "My preference",
     metadata: {
       user: "alice",
       project: "my-project",
       memory_type: "preference"
     }
   })
   ```

2. **Deduplicate manually:**
   Create `deduplicate.js`:
   ```javascript
   import fs from 'fs';
   
   const data = JSON.parse(fs.readFileSync('data/memories.json', 'utf8'));
   const seen = new Set();
   const unique = data.memories.filter(m => {
     const key = `${m.content}-${m.metadata.user}`;
     if (seen.has(key)) return false;
     seen.add(key);
     return true;
   });
   
   fs.writeFileSync(
     'data/memories.json',
     JSON.stringify({ memories: unique }, null, 2)
   );
   console.log(`Removed ${data.memories.length - unique.length} duplicates`);
   ```

### Issue: Missing embeddings

**Symptoms:**
- Search returns no results
- Semantic search not working

**Solutions:**

1. **Regenerate embeddings:**
   ```bash
   # MemoryLoom auto-generates missing embeddings
   # Just restart the server
   npm start
   ```

2. **Verify embeddings exist:**
   ```bash
   cat data/memories.json | grep '"embedding"' | head -1
   # Should show array of numbers
   ```

---

## Editor-Specific Issues

### Claude Desktop

**Issue:** Config changes not taking effect

**Solution:**
```bash
# Fully quit Claude Desktop
# macOS: Cmd+Q (not just close window)
# Windows: Right-click tray icon → Quit

# Wait 5 seconds
# Restart Claude Desktop
```

**Issue:** "Failed to start MCP server"

**Solution:**
```bash
# Check Node.js in PATH
which node

# If not found, add to PATH or use absolute path
{
  "command": "/usr/local/bin/node"
}
```

### Cursor

**Issue:** MCP tools not in chat

**Solution:**
```bash
# Check both configs
cat ~/.cursor/mcp.json
cat .cursor/mcp.json  # Project-level

# Reload window
# Cmd/Ctrl+Shift+P → "Developer: Reload Window"
```

**Issue:** "Cannot find module"

**Solution:**
```json
// Use absolute paths only
{
  "args": ["/Users/yourname/memoryloom/server.js"]
}
// Not: ["./server.js"] or ["~/memoryloom/server.js"]
```

### VS Code

**Issue:** @memoryloom not recognized

**Solution:**
```bash
# Update GitHub Copilot extension
# Extensions → GitHub Copilot → Update

# Reload window
# Cmd/Ctrl+Shift+P → "Developer: Reload Window"

# Wait 10-15 seconds for MCP initialization
```

**Issue:** MCP servers not loading

**Solution:**
```json
// Check settings.json location
// File → Preferences → Settings → Open Settings (JSON)

{
  "github.copilot.mcp.servers": {
    "memoryloom": {
      "command": "node",
      "args": ["/absolute/path/to/server.js"]
    }
  }
}
```

### Windsurf

**Issue:** Cascade not using tools

**Solution:**
```bash
# Open Cascade sidebar
# Click 🔨 (hammer) icon
# Verify MemoryLoom is listed and enabled
# Toggle off and on if needed

# Check config
cat ~/.codeium/windsurf/mcp_config.json
```

**Issue:** "MCP server crashed"

**Solution:**
```bash
# Validate JSON
cat ~/.codeium/windsurf/mcp_config.json | python3 -m json.tool

# Check for trailing commas, missing quotes
```

### Zed

**Issue:** Context server not loading

**Solution:**
```json
// Zed uses different key name
{
  "context_servers": {  // Not "mcpServers"
    "memoryloom": {
      "command": "node",
      "args": ["/path/to/server.js"]
    }
  }
}
```

**Issue:** "Command not found: node"

**Solution:**
```bash
# Find node path
which node

# Use absolute path
{
  "command": "/usr/local/bin/node"
}
```

---

## Advanced Debugging

### Enable Debug Logging

```json
{
  "mcpServers": {
    "memoryloom": {
      "command": "node",
      "args": ["/path/to/server.js"],
      "env": {
        "MEMORYLOOM_LOG_LEVEL": "debug"
      }
    }
  }
}
```

### Check Server Logs

**macOS:**
```bash
# Console.app
open /Applications/Utilities/Console.app

# Or terminal
log stream --predicate 'process == "node"' --level debug
```

**Linux:**
```bash
journalctl -f | grep node
```

**Windows:**
```powershell
# Event Viewer
eventvwr.msc

# Or PowerShell
Get-EventLog -LogName Application -Source Node -Newest 50
```

### Test MCP Protocol Directly

```bash
# Test initialization
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' | node server.js

# Test tool list
echo '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' | node server.js

# Test add memory
echo '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"add_memory","arguments":{"content":"test"}}}' | node server.js
```

### Network Debugging

```bash
# Check if port is in use
lsof -i :8080

# Monitor network connections
netstat -an | grep 8080

# Test HTTP health endpoint (if enabled)
curl http://localhost:8080/health
```

### File System Debugging

```bash
# Monitor file changes
fswatch data/memories.json

# Check file locks
lsof data/memories.json

# Monitor disk I/O
iostat -w 1
```

---

## Getting Help

If you're still stuck after trying these solutions:

1. **Gather diagnostic information:**
   ```bash
   # System info
   uname -a
   node --version
   npm --version
   
   # MemoryLoom info
   cd /path/to/memoryloom
   npm list
   cat package.json
   
   # Test results
   npm run verify 2>&1 | tee verify-output.txt
   ```

2. **Check existing issues:**
   - [GitHub Issues](https://github.com/bunnysayzz/memoryloom/issues)

3. **Create a new issue:**
   - Include diagnostic information
   - Describe what you tried
   - Include error messages
   - Specify your editor and OS

4. **Community resources:**
   - [MCP Discord](https://discord.gg/modelcontextprotocol)
   - [MCP Documentation](https://modelcontextprotocol.io)

---

## Prevention Tips

### Regular Maintenance

```bash
# Weekly: Update dependencies
npm update

# Weekly: Clean old backups
find data/backups -mtime +30 -delete

# Monthly: Archive old memories
# Use delete_memory with hard_delete=false
```

### Best Practices

1. **Always use absolute paths** in config files
2. **Enable backups** in production
3. **Use metadata filters** for better performance
4. **Keep memories concise** (< 500 characters)
5. **Archive inactive memories** regularly
6. **Test after config changes** with simple memory operations
7. **Monitor disk space** if using JSON mode
8. **Use Postgres mode** for team/production use

---

**Last Updated:** April 2026  
**MemoryLoom Version:** 0.5.0
