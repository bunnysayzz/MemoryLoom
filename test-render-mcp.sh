#!/bin/bash

echo "🧪 Testing MemoryLoom on Render"
echo "================================"
echo ""

URL="https://memoryloom-6g1x.onrender.com"
API_KEY="hGmcDJNs4vl+HKn/afNoSUwzcpdOC2WueXqqWZtVUKA="

# Test 1: Health Check
echo "1. Testing Health Endpoint..."
curl -s "$URL/health" | jq '.' || echo "Failed"
echo ""

# Test 2: Memory Stats
echo "2. Testing Memory Stats..."
curl -s -X POST "$URL/mcp" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"memory_stats","arguments":{}}}' | jq '.'
echo ""

# Test 3: Add Memory
echo "3. Testing Add Memory..."
curl -s -X POST "$URL/mcp" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"add_memory","arguments":{"content":"Test memory from Render deployment","importance":0.8,"metadata":{"user":"test","project":"render-test","tags":["test","render"]}}}}' | jq '.'
echo ""

# Test 4: List Memories
echo "4. Testing List Memories..."
curl -s -X POST "$URL/mcp" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"list_memories","arguments":{"limit":10}}}' | jq '.'
echo ""

# Test 5: Search Memories
echo "5. Testing Search Memories..."
curl -s -X POST "$URL/mcp" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"search_memories","arguments":{"query":"test render","limit":5}}}' | jq '.'
echo ""

echo "================================"
echo "✅ Testing Complete!"
echo ""
echo "🌐 Visit UI: $URL"
echo ""
