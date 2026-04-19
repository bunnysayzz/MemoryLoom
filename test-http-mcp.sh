#!/bin/bash

# Test HTTP MCP endpoint
# Usage: ./test-http-mcp.sh [port] [api-key]

PORT=${1:-8080}
API_KEY=${2:-""}

echo "Testing HTTP MCP endpoint on port $PORT..."
echo ""

# Start server in background
export MEMORYLOOM_HEALTH_PORT=$PORT
export MEMORYLOOM_API_KEY="$API_KEY"
export MEMORYLOOM_DATA_DIR="./data"
node server.js > /dev/null 2>&1 &
SERVER_PID=$!

# Wait for server to start
sleep 2

# Get API key if not provided
if [ -z "$API_KEY" ]; then
  API_KEY=$(cat data/.api_key 2>/dev/null || echo "")
fi

echo "Server PID: $SERVER_PID"
echo "API Key: $API_KEY"
echo ""

# Test 1: Health check
echo "Test 1: Health check"
curl -s -X GET "http://localhost:$PORT/health" \
  -H "Authorization: Bearer $API_KEY" | jq '.'
echo ""

# Test 2: Initialize
echo "Test 2: Initialize"
curl -s -X POST "http://localhost:$PORT/mcp" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {}
  }' | jq '.'
echo ""

# Test 3: List tools
echo "Test 3: List tools"
curl -s -X POST "http://localhost:$PORT/mcp" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/list",
    "params": {}
  }' | jq '.result.tools | length'
echo ""

# Test 4: Add memory
echo "Test 4: Add memory"
curl -s -X POST "http://localhost:$PORT/mcp" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d "{
    \"jsonrpc\": \"2.0\",
    \"id\": 3,
    \"method\": \"tools/call\",
    \"params\": {
      \"name\": \"add_memory\",
      \"arguments\": {
        \"api_key\": \"$API_KEY\",
        \"content\": \"HTTP MCP test memory\",
        \"importance\": 0.9,
        \"metadata\": {
          \"user\": \"test-user\",
          \"project\": \"http-mcp-test\",
          \"tags\": [\"test\"]
        }
      }
    }
  }" | jq '.result.content[0].text | fromjson | .ok'
echo ""

# Test 5: Search memories
echo "Test 5: Search memories"
curl -s -X POST "http://localhost:$PORT/mcp" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d "{
    \"jsonrpc\": \"2.0\",
    \"id\": 4,
    \"method\": \"tools/call\",
    \"params\": {
      \"name\": \"search_memories\",
      \"arguments\": {
        \"api_key\": \"$API_KEY\",
        \"query\": \"HTTP MCP test\"
      }
    }
  }" | jq '.result.content[0].text | fromjson | .count'
echo ""

# Cleanup
echo "Stopping server..."
kill $SERVER_PID 2>/dev/null
wait $SERVER_PID 2>/dev/null

echo ""
echo "✅ HTTP MCP tests completed!"
