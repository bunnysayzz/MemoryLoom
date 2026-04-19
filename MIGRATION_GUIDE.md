# Migration Guide

Guide for migrating to MemoryLoom from other memory systems or setting up MemoryLoom in different scenarios.

## Table of Contents

- [Migrating from Other MCP Memory Servers](#migrating-from-other-mcp-memory-servers)
- [Migrating Between Storage Modes](#migrating-between-storage-modes)
- [Moving Between Machines](#moving-between-machines)
- [Team Setup](#team-setup)
- [Backup and Restore](#backup-and-restore)

---

## Migrating from Other MCP Memory Servers

### From mem0 or similar memory servers

If you're currently using another MCP memory server, here's how to migrate:

#### Step 1: Export Your Existing Data

Most memory servers store data in JSON format. Locate your existing memory file:

```bash
# Common locations
~/.mem0/memories.json
~/.memory/data.json
~/Library/Application Support/[AppName]/memories.json
```

#### Step 2: Transform Data Format

MemoryLoom uses this memory structure:

```json
{
  "memories": [
    {
      "id": "uuid",
      "content": "Memory content text",
      "embedding": [0.1, 0.2, ...],
      "importance": 0.8,
      "metadata": {
        "user": "username",
        "project": "project-name",
        "tags": ["tag1", "tag2"],
        "source": "manual",
        "memory_type": "preference",
        "confidence": 0.95,
        "created_at": "2026-04-19T10:00:00.000Z",
        "updated_at": "2026-04-19T10:00:00.000Z",
        "last_accessed_at": "2026-04-19T10:00:00.000Z",
        "archived": false
      }
    }
  ]
}
```

#### Step 3: Create Transformation Script

Save this as `migrate.js`:

```javascript
import fs from 'fs';
import { randomUUID } from 'crypto';

// Read your old memory file
const oldData = JSON.parse(fs.readFileSync('old-memories.json', 'utf8'));

// Transform to MemoryLoom format
const memoryloomData = {
  memories: oldData.map(item => ({
    id: item.id || randomUUID(),
    content: item.content || item.text || item.message,
    embedding: item.embedding || [],
    importance: item.importance || item.priority || 0.5,
    metadata: {
      user: item.user || 'default',
      project: item.project || 'general',
      tags: item.tags || [],
      source: 'migration',
      memory_type: item.type || 'general',
      confidence: item.confidence || 1.0,
      created_at: item.created_at || new Date().toISOString(),
      updated_at: item.updated_at || new Date().toISOString(),
      last_accessed_at: item.last_accessed_at || new Date().toISOString(),
      archived: false
    }
  }))
};

// Write to MemoryLoom format
fs.writeFileSync('data/memories.json', JSON.stringify(memoryloomData, null, 2));
console.log(`Migrated ${memoryloomData.memories.length} memories`);
```

Run the migration:

```bash
node migrate.js
```

#### Step 4: Update Editor Configuration

Replace your old memory server config with MemoryLoom:

**Before:**
```json
{
  "mcpServers": {
    "old-memory-server": {
      "command": "node",
      "args": ["/path/to/old-server.js"]
    }
  }
}
```

**After:**
```json
{
  "mcpServers": {
    "memoryloom": {
      "command": "node",
      "args": ["/path/to/memoryloom/server.js"]
    }
  }
}
```

#### Step 5: Verify Migration

```bash
cd memoryloom
npm run verify
```

---

## Migrating Between Storage Modes

### JSON to Postgres

#### Step 1: Set Up Postgres Database

```bash
# Install Postgres (macOS)
brew install postgresql
brew services start postgresql

# Create database
createdb memoryloom

# Or use a hosted service (Neon, Supabase, etc.)
```

#### Step 2: Export JSON Data

```bash
# Backup your current data
cp data/memories.json data/memories-backup.json
```

#### Step 3: Update Configuration

```json
{
  "mcpServers": {
    "memoryloom": {
      "command": "node",
      "args": ["/path/to/memoryloom/server.js"],
      "env": {
        "MEMORYLOOM_STORAGE_MODE": "postgres",
        "MEMORYLOOM_POSTGRES_URL": "postgres://user:password@localhost:5432/memoryloom"
      }
    }
  }
}
```

#### Step 4: Import Data

Create `import-to-postgres.js`:

```javascript
import fs from 'fs';
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgres://user:password@localhost:5432/memoryloom'
});

async function importData() {
  const data = JSON.parse(fs.readFileSync('data/memories.json', 'utf8'));
  
  for (const memory of data.memories) {
    await pool.query(
      `INSERT INTO memoryloom_memories (id, content, embedding, importance, metadata)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO NOTHING`,
      [
        memory.id,
        memory.content,
        JSON.stringify(memory.embedding),
        memory.importance,
        JSON.stringify(memory.metadata)
      ]
    );
  }
  
  console.log(`Imported ${data.memories.length} memories`);
  await pool.end();
}

importData();
```

Run the import:

```bash
node import-to-postgres.js
```

### Postgres to JSON

#### Step 1: Export from Postgres

Create `export-from-postgres.js`:

```javascript
import fs from 'fs';
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgres://user:password@localhost:5432/memoryloom'
});

async function exportData() {
  const result = await pool.query('SELECT * FROM memoryloom_memories');
  
  const memories = result.rows.map(row => ({
    id: row.id,
    content: row.content,
    embedding: JSON.parse(row.embedding),
    importance: row.importance,
    metadata: JSON.parse(row.metadata)
  }));
  
  fs.writeFileSync(
    'data/memories.json',
    JSON.stringify({ memories }, null, 2)
  );
  
  console.log(`Exported ${memories.length} memories`);
  await pool.end();
}

exportData();
```

#### Step 2: Update Configuration

```json
{
  "mcpServers": {
    "memoryloom": {
      "command": "node",
      "args": ["/path/to/memoryloom/server.js"],
      "env": {
        "MEMORYLOOM_STORAGE_MODE": "json",
        "MEMORYLOOM_DATA_DIR": "/path/to/data"
      }
    }
  }
}
```

---

## Moving Between Machines

### Scenario 1: Same User, Different Machine

#### Step 1: On Old Machine

```bash
# Backup your data
cd memoryloom
tar -czf memoryloom-backup.tar.gz data/

# Or just copy the JSON file
cp data/memories.json ~/Desktop/
```

#### Step 2: On New Machine

```bash
# Install MemoryLoom
git clone https://github.com/bunnysayzz/memoryloom.git
cd memoryloom
npm install

# Restore data
tar -xzf memoryloom-backup.tar.gz
# Or copy the JSON file
cp ~/Desktop/memories.json data/

# Verify
npm run verify
```

#### Step 3: Update Editor Config

Update the path in your editor's MCP config to point to the new location.

### Scenario 2: Cloud Sync Setup

Use a cloud storage service to sync memories across machines:

#### Using Dropbox/Google Drive/iCloud

```json
{
  "mcpServers": {
    "memoryloom": {
      "command": "node",
      "args": ["/path/to/memoryloom/server.js"],
      "env": {
        "MEMORYLOOM_DATA_DIR": "/Users/yourname/Dropbox/memoryloom-data"
      }
    }
  }
}
```

**Important:** Only run MemoryLoom on one machine at a time to avoid conflicts.

#### Using Git

```bash
# Initialize git in data directory
cd data
git init
git add memories.json
git commit -m "Initial memories"

# Push to private repo
git remote add origin git@github.com:yourname/memoryloom-data-private.git
git push -u origin main

# On other machine
cd memoryloom/data
git clone git@github.com:yourname/memoryloom-data-private.git .
```

Create a sync script `sync-memories.sh`:

```bash
#!/bin/bash
cd /path/to/memoryloom/data
git pull --rebase
git add memories.json
git commit -m "Sync memories $(date)"
git push
```

---

## Team Setup

### Scenario 1: Shared Postgres Database

Best for teams that need concurrent access.

#### Step 1: Deploy Postgres

Use a hosted service:
- [Neon](https://neon.tech) - Serverless Postgres
- [Supabase](https://supabase.com) - Open source Firebase alternative
- [Railway](https://railway.app) - Simple deployment
- [Render](https://render.com) - Managed Postgres

#### Step 2: Team Member Configuration

Each team member uses the same config:

```json
{
  "mcpServers": {
    "memoryloom-team": {
      "command": "node",
      "args": ["/path/to/memoryloom/server.js"],
      "env": {
        "MEMORYLOOM_STORAGE_MODE": "postgres",
        "MEMORYLOOM_POSTGRES_URL": "postgres://user:pass@host:5432/memoryloom",
        "MEMORYLOOM_API_KEY": "team-shared-secret"
      }
    }
  }
}
```

#### Step 3: Access Control

Use metadata to separate team member data:

```javascript
// Each team member stores with their user ID
{
  "content": "My preference",
  "metadata": {
    "user": "alice",
    "project": "team-project"
  }
}

// Search only your memories
{
  "query": "preferences",
  "filters": {
    "user": "alice"
  }
}
```

### Scenario 2: Deployed MemoryLoom Server

Deploy MemoryLoom to a server accessible by the team.

#### Step 1: Deploy to Heroku/Render/Railway

Click one of the deploy buttons in the [README](README.md#one-click-deploy).

#### Step 2: Configure Team Members

```json
{
  "mcpServers": {
    "memoryloom-team": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://your-memoryloom-server.herokuapp.com/mcp"
      ],
      "env": {
        "MEMORYLOOM_API_KEY": "team-shared-secret"
      }
    }
  }
}
```

**Note:** This requires an MCP remote adapter. Alternatively, use SSH tunneling.

---

## Backup and Restore

### Automatic Backups (JSON Mode)

Enable automatic backups:

```json
{
  "mcpServers": {
    "memoryloom": {
      "command": "node",
      "args": ["/path/to/memoryloom/server.js"],
      "env": {
        "MEMORYLOOM_BACKUP_ON_WRITE": "true",
        "MEMORYLOOM_BACKUP_RETENTION": "10"
      }
    }
  }
}
```

Backups are stored in `data/backups/` with timestamps:
```
data/backups/memories-2026-04-19T10-30-00-000Z.json
data/backups/memories-2026-04-19T11-15-00-000Z.json
```

### Manual Backup

#### JSON Mode

```bash
# Simple copy
cp data/memories.json data/memories-backup-$(date +%Y%m%d).json

# Compressed backup
tar -czf memoryloom-backup-$(date +%Y%m%d).tar.gz data/
```

#### Postgres Mode

```bash
# Dump database
pg_dump memoryloom > memoryloom-backup-$(date +%Y%m%d).sql

# Compressed dump
pg_dump memoryloom | gzip > memoryloom-backup-$(date +%Y%m%d).sql.gz
```

### Restore from Backup

#### JSON Mode

```bash
# Restore from backup
cp data/backups/memories-2026-04-19T10-30-00-000Z.json data/memories.json

# Or from manual backup
cp data/memories-backup-20260419.json data/memories.json
```

#### Postgres Mode

```bash
# Restore from dump
psql memoryloom < memoryloom-backup-20260419.sql

# From compressed dump
gunzip -c memoryloom-backup-20260419.sql.gz | psql memoryloom
```

### Scheduled Backups

#### macOS/Linux (cron)

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cp /path/to/memoryloom/data/memories.json /path/to/backups/memories-$(date +\%Y\%m\%d).json
```

#### Windows (Task Scheduler)

Create `backup.bat`:

```batch
@echo off
set BACKUP_DIR=C:\backups\memoryloom
set DATE=%date:~-4,4%%date:~-10,2%%date:~-7,2%
copy C:\path\to\memoryloom\data\memories.json %BACKUP_DIR%\memories-%DATE%.json
```

Schedule in Task Scheduler to run daily.

---

## Best Practices

### Data Organization

**Use consistent metadata:**
```json
{
  "user": "alice",
  "project": "project-name",
  "memory_type": "preference|decision|context|task|reference",
  "tags": ["category", "subcategory"]
}
```

**Archive old memories:**
```javascript
// Instead of deleting, archive
{
  "id": "memory-id",
  "hard_delete": false  // Archives instead of deleting
}
```

### Performance

**For large datasets:**
- Use Postgres mode
- Add database indexes
- Use metadata filters in searches
- Archive inactive memories

**For small datasets:**
- JSON mode is faster
- Enable backups
- Keep memories concise

### Security

**Protect sensitive data:**
- Use API keys: `MEMORYLOOM_API_KEY=secret`
- Restrict file permissions: `chmod 600 data/memories.json`
- Use encrypted storage for backups
- Don't commit memories to public repos

---

## Troubleshooting Migration Issues

### "Duplicate key" errors during import

**Solution:** Use `ON CONFLICT DO NOTHING` or `DO UPDATE` in your import script.

### Embeddings not working after migration

**Solution:** MemoryLoom will regenerate embeddings automatically. If not, delete the `embedding` field and let MemoryLoom recreate it.

### Metadata format mismatch

**Solution:** Ensure your transformation script maps all required metadata fields. Missing fields will use defaults.

### Performance degradation after migration

**Solution:** 
- Rebuild indexes (Postgres)
- Archive old memories
- Optimize search queries with filters

---

## Support

Need help with migration?

1. Check the [Editor Setup Guide](EDITOR_SETUP.md)
2. Review the [API Documentation](MemoryLoom_Documentation.txt)
3. Open an issue on [GitHub](https://github.com/bunnysayzz/memoryloom/issues)

---

**Last Updated:** April 2026  
**MemoryLoom Version:** 0.5.0
