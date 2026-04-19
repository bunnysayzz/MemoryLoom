// Netlify serverless function wrapper for MemoryLoom MCP server
import { createMemoryStore } from '../../lib/store.js';

const store = createMemoryStore({
  storageMode: process.env.MEMORYLOOM_STORAGE_MODE || 'json',
  dataDir: '/tmp/memoryloom-data',
  dataFile: '/tmp/memoryloom-data/memories.json',
  backupDir: '/tmp/memoryloom-data/backups',
  logLevel: process.env.MEMORYLOOM_LOG_LEVEL || 'info',
  backupOnWrite: process.env.MEMORYLOOM_BACKUP_ON_WRITE === 'true',
  backupRetention: parseInt(process.env.MEMORYLOOM_BACKUP_RETENTION || '5', 10),
  postgresUrl: process.env.MEMORYLOOM_POSTGRES_URL || '',
  apiKey: process.env.MEMORYLOOM_API_KEY || '',
  healthPort: 0, // Not used in serverless
  maxToolCallsPerMinute: parseInt(process.env.MEMORYLOOM_MAX_TOOL_CALLS_PER_MINUTE || '0', 10),
  webUiEnabled: process.env.MEMORYLOOM_WEB_UI !== 'false'
});

export async function handler(event, context) {
  // Health check endpoints
  if (event.path === '/health' || event.path === '/.netlify/functions/api/health') {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() })
    };
  }

  if (event.path === '/ready' || event.path === '/.netlify/functions/api/ready') {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'ready', timestamp: new Date().toISOString() })
    };
  }

  // MCP protocol handler
  if (event.httpMethod === 'POST') {
    try {
      const body = JSON.parse(event.body || '{}');
      
      // Handle MCP requests
      // Note: Full MCP implementation would go here
      // This is a simplified version for serverless deployment
      
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'MemoryLoom MCP Server (Netlify)',
          note: 'MCP over stdio is not supported in serverless. Use HTTP endpoints or deploy to a container platform.'
        })
      };
    } catch (error) {
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: error.message })
      };
    }
  }

  return {
    statusCode: 404,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: 'Not found' })
  };
}
