/**
 * Netlify Functions wrapper for MemoryLoom
 * 
 * NOTE: Netlify Functions are serverless and do not support MCP stdio protocol.
 * This wrapper provides HTTP endpoints for health checks and basic API access only.
 * For full MCP functionality, deploy to a container platform (Railway, Fly.io, Heroku, Render).
 */

export async function handler(event, context) {
  const { path, httpMethod, headers } = event;
  
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
    'Content-Type': 'application/json'
  };

  // Handle CORS preflight
  if (httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  // Health endpoint
  if (path === '/api/health' || path === '/.netlify/functions/api/health') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        ok: true,
        server: 'memoryloom',
        version: '0.5.0',
        mode: 'netlify-functions',
        warning: 'MCP stdio protocol not supported in serverless environment. Deploy to container platform for full functionality.'
      })
    };
  }

  // Ready endpoint
  if (path === '/api/ready' || path === '/.netlify/functions/api/ready') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        ok: true,
        server: 'memoryloom',
        version: '0.5.0',
        mode: 'netlify-functions',
        warning: 'MCP stdio protocol not supported in serverless environment. Deploy to container platform for full functionality.'
      })
    };
  }

  // All other endpoints - return not supported message
  return {
    statusCode: 501,
    headers: corsHeaders,
    body: JSON.stringify({
      ok: false,
      error: 'not_implemented',
      message: 'MemoryLoom requires MCP stdio protocol which is not supported in Netlify Functions.',
      recommendation: 'Deploy to a container platform (Railway, Fly.io, Heroku, Render) for full MCP functionality.',
      documentation: 'https://github.com/bunnysayzz/memoryloom#deployment-files'
    })
  };
}
