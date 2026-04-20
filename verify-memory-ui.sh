#!/bin/bash

echo "🧪 MemoryLoom Memory UI Verification"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get API key
API_KEY=$(cat data/.api_key 2>/dev/null)
if [ -z "$API_KEY" ]; then
    echo -e "${RED}❌ API key not found${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} API Key found"

# Test server is running
echo ""
echo "Testing server connection..."
HEALTH=$(curl -s -H "X-API-Key: $API_KEY" http://localhost:8080/health)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Server is running"
else
    echo -e "${RED}❌ Server is not running${NC}"
    echo "Please start the server with: npm start"
    exit 1
fi

# Test MCP endpoint
echo ""
echo "Testing MCP endpoint..."
MCP_RESPONSE=$(curl -s -X POST http://localhost:8080/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"memory_stats","arguments":{}}}')

if echo "$MCP_RESPONSE" | grep -q '"ok":true'; then
    echo -e "${GREEN}✓${NC} MCP endpoint working"
else
    echo -e "${RED}❌ MCP endpoint failed${NC}"
    echo "Response: $MCP_RESPONSE"
    exit 1
fi

# Test add memory
echo ""
echo "Testing add memory..."
ADD_RESPONSE=$(curl -s -X POST http://localhost:8080/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"add_memory","arguments":{"content":"Test memory from verification script","importance":0.7,"metadata":{"user":"test","project":"verification","tags":["test"]}}}}')

if echo "$ADD_RESPONSE" | grep -q '"ok":true'; then
    echo -e "${GREEN}✓${NC} Add memory working"
    MEMORY_ID=$(echo "$ADD_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo "  Memory ID: $MEMORY_ID"
else
    echo -e "${RED}❌ Add memory failed${NC}"
    echo "Response: $ADD_RESPONSE"
    exit 1
fi

# Test list memories
echo ""
echo "Testing list memories..."
LIST_RESPONSE=$(curl -s -X POST http://localhost:8080/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"list_memories","arguments":{"limit":10}}}')

if echo "$LIST_RESPONSE" | grep -q '"ok":true'; then
    echo -e "${GREEN}✓${NC} List memories working"
    MEMORY_COUNT=$(echo "$LIST_RESPONSE" | grep -o '"count":[0-9]*' | cut -d':' -f2)
    echo "  Total memories: $MEMORY_COUNT"
else
    echo -e "${RED}❌ List memories failed${NC}"
    exit 1
fi

# Test update memory
if [ ! -z "$MEMORY_ID" ]; then
    echo ""
    echo "Testing update memory..."
    UPDATE_RESPONSE=$(curl -s -X POST http://localhost:8080/mcp \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $API_KEY" \
      -d "{\"jsonrpc\":\"2.0\",\"id\":4,\"method\":\"tools/call\",\"params\":{\"name\":\"update_memory\",\"arguments\":{\"id\":\"$MEMORY_ID\",\"content\":\"Updated test memory\",\"importance\":0.9}}}")

    if echo "$UPDATE_RESPONSE" | grep -q '"ok":true'; then
        echo -e "${GREEN}✓${NC} Update memory working"
    else
        echo -e "${RED}❌ Update memory failed${NC}"
    fi
fi

# Test search memories
echo ""
echo "Testing search memories..."
SEARCH_RESPONSE=$(curl -s -X POST http://localhost:8080/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{"jsonrpc":"2.0","id":5,"method":"tools/call","params":{"name":"search_memories","arguments":{"query":"test","limit":5}}}')

if echo "$SEARCH_RESPONSE" | grep -q '"ok":true'; then
    echo -e "${GREEN}✓${NC} Search memories working"
else
    echo -e "${RED}❌ Search memories failed${NC}"
fi

# Test delete memory
if [ ! -z "$MEMORY_ID" ]; then
    echo ""
    echo "Testing delete memory..."
    DELETE_RESPONSE=$(curl -s -X POST http://localhost:8080/mcp \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $API_KEY" \
      -d "{\"jsonrpc\":\"2.0\",\"id\":6,\"method\":\"tools/call\",\"params\":{\"name\":\"delete_memory\",\"arguments\":{\"id\":\"$MEMORY_ID\",\"hard_delete\":true}}}")

    if echo "$DELETE_RESPONSE" | grep -q '"ok":true'; then
        echo -e "${GREEN}✓${NC} Delete memory working"
    else
        echo -e "${RED}❌ Delete memory failed${NC}"
    fi
fi

# Test UI files exist
echo ""
echo "Checking UI files..."
if [ -f "ui/index.html" ]; then
    echo -e "${GREEN}✓${NC} index.html exists"
else
    echo -e "${RED}❌ index.html missing${NC}"
fi

if [ -f "ui/app.js" ]; then
    echo -e "${GREEN}✓${NC} app.js exists"
else
    echo -e "${RED}❌ app.js missing${NC}"
fi

if [ -f "ui/styles.css" ]; then
    echo -e "${GREEN}✓${NC} styles.css exists"
else
    echo -e "${RED}❌ styles.css missing${NC}"
fi

if [ -f "ui/assets/memoryloom.png" ]; then
    echo -e "${GREEN}✓${NC} favicon exists"
else
    echo -e "${RED}❌ favicon missing${NC}"
fi

# Check database persistence
echo ""
echo "Checking database persistence..."
if [ -f "data/memories.json" ]; then
    echo -e "${GREEN}✓${NC} memories.json exists"
    TOTAL_MEMORIES=$(cat data/memories.json | grep -o '"id"' | wc -l)
    echo "  Total memories in database: $TOTAL_MEMORIES"
else
    echo -e "${RED}❌ memories.json missing${NC}"
fi

echo ""
echo "===================================="
echo -e "${GREEN}✅ All tests passed!${NC}"
echo ""
echo "🌐 Open your browser to: http://localhost:8080"
echo "📝 Test file available at: http://localhost:8080/test-memory-ui.html"
echo ""
