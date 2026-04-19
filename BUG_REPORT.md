# MemoryLoom - Comprehensive Bug & Issue Report

**Generated:** 2026-04-19  
**Project Version:** 0.5.0

---

## 🔴 CRITICAL BUGS (Must Fix Immediately)

### 1. **Missing `parseToolResult` Function in verify.js**
**Severity:** CRITICAL  
**File:** `scripts/verify.js`  
**Lines:** 203, 220, 237, 251, 266, 326, 341, 350, 359, 373

**Issue:**  
The verification script calls `parseToolResult()` function 13 times but this function is **never defined** anywhere in the file. This causes the entire verification script to fail immediately.

**Impact:**  
- `npm run verify` and `npm test` commands will crash
- CI/CD pipelines will fail
- Users cannot verify their installation

**Fix Required:**
```javascript
// Add this function to scripts/verify.js before the try block
function parseToolResult(response) {
  if (response.error) {
    throw new Error(response.error.message || 'Tool call failed');
  }
  if (!response.result || !response.result.content || !response.result.content[0]) {
    throw new Error('Invalid tool response format');
  }
  return JSON.parse(response.result.content[0].text);
}
```

---

### 2. **Missing Netlify Functions Directory**
**Severity:** CRITICAL  
**File:** `netlify.toml`  
**Referenced Path:** `netlify/functions/api.js`

**Issue:**  
The `netlify.toml` configuration references `netlify/functions` directory and specifically `netlify/functions/api.js`, but:
- The `netlify/functions/` directory does not exist
- The `api.js` file does not exist
- README claims Netlify deployment support but it's incomplete

**Impact:**  
- Netlify deployments will fail completely
- Users clicking "Deploy to Netlify" button will get errors
- False advertising in README

**Fix Required:**
1. Create `netlify/functions/api.js` with proper serverless function wrapper
2. OR remove Netlify from deployment options in README
3. OR add disclaimer that Netlify has "Limited MCP Support" (already mentioned but deployment still broken)

---

### 3. **Missing Azure Deployment Template**
**Severity:** HIGH  
**File:** README.md  
**Referenced:** `azure-deploy.json`

**Issue:**  
README has "Deploy to Azure" button linking to:
```
https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2Fbunnysayzz%2Fmemoryloom%2Fmain%2Fazure-deploy.json
```

But `azure-deploy.json` file does not exist in the repository.

**Impact:**  
- Azure deployment button is broken
- 404 error when users try to deploy
- Poor user experience

**Fix Required:**
1. Create `azure-deploy.json` ARM template
2. OR remove Azure deployment button from README

---

## 🟠 HIGH PRIORITY BUGS

### 4. **Race Condition in JSON Store Write Queue**
**Severity:** HIGH  
**File:** `lib/stores/json-store.js`  
**Lines:** 73-79

**Issue:**  
```javascript
async replaceAll(memories) {
  const writePromise = this.writeQueue.then(async () => {
    this.saveMemories(memories);
  });
  this.writeQueue = writePromise.catch(() => {});  // ⚠️ Silently swallows errors
  await writePromise;
}
```

The error handler `catch(() => {})` silently swallows all write errors. If a write fails:
- The error is hidden from the caller
- Data loss can occur without any notification
- Subsequent writes may proceed with stale queue state

**Impact:**  
- Silent data loss
- Difficult to debug write failures
- Backup corruption possible

**Fix Required:**
```javascript
async replaceAll(memories) {
  const writePromise = this.writeQueue.then(async () => {
    this.saveMemories(memories);
  });
  this.writeQueue = writePromise.catch((error) => {
    // Log error but don't break the queue
    console.error('Write queue error:', error);
    throw error; // Re-throw so caller knows
  });
  await writePromise;
}
```

---

### 5. **Postgres Store Missing Error Handling for Connection Failures**
**Severity:** HIGH  
**File:** `lib/stores/postgres-store.js`  
**Lines:** 15-30

**Issue:**  
The `getPool()` method creates a connection pool but doesn't handle connection failures gracefully:
- No retry logic
- No connection timeout configuration
- No max connection limits set
- Pool errors not caught

**Impact:**  
- Server crashes on database connection loss
- No graceful degradation
- Resource leaks possible

**Fix Required:**
```javascript
this.pool = new Pool({
  connectionString,
  max: 20,                    // Max connections
  idleTimeoutMillis: 30000,   // Close idle connections
  connectionTimeoutMillis: 5000, // Connection timeout
});

// Add error handler
this.pool.on('error', (err) => {
  console.error('Unexpected pool error:', err);
});
```

---

### 6. **Memory Leak in Health Check Endpoint**
**Severity:** HIGH  
**File:** `server.js`  
**Lines:** 1180-1240

**Issue:**  
The health check HTTP server is created but error handlers are not properly attached:
```javascript
healthServer = http.createServer(async (req, res) => {
  // ... handler code
});
```

No error event handler means unhandled errors will crash the process.

**Impact:**  
- Server crashes on malformed HTTP requests
- No graceful error recovery
- Denial of service vulnerability

**Fix Required:**
```javascript
healthServer = http.createServer(async (req, res) => {
  // ... existing handler code
});

healthServer.on('error', (error) => {
  writeLog('error', 'health_server_error', {
    details: error instanceof Error ? error.message : 'unknown'
  });
});

healthServer.on('clientError', (err, socket) => {
  socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});
```

---

### 7. **Unbounded Memory Growth in Embedding Generation**
**Severity:** HIGH  
**File:** `server.js`  
**Lines:** 145-175

**Issue:**  
The `generateEmbedding()` function creates n-grams for every token without any limits:
```javascript
for (const token of tokens) {
  grams.push(token);
  if (token.length > 2) {
    for (let index = 0; index <= token.length - 3; index += 1) {
      grams.push(token.slice(index, index + 3));  // Unbounded growth
    }
  }
}
```

For very long content (up to 100KB allowed), this can create millions of n-grams.

**Impact:**  
- Memory exhaustion on large content
- Slow embedding generation
- Potential DoS vector

**Fix Required:**
```javascript
const MAX_GRAMS = 10000; // Add limit
const grams = [];

for (const token of tokens) {
  if (grams.length >= MAX_GRAMS) break;
  grams.push(token);
  if (token.length > 2) {
    for (let index = 0; index <= token.length - 3; index += 1) {
      if (grams.length >= MAX_GRAMS) break;
      grams.push(token.slice(index, index + 3));
    }
  }
}
```

---

## 🟡 MEDIUM PRIORITY BUGS

### 8. **Inconsistent Error Messages in API Responses**
**Severity:** MEDIUM  
**File:** `server.js`  
**Lines:** Various

**Issue:**  
Error messages are inconsistent:
- Some use backticks: `` `content` is required ``
- Some use quotes: `"Memory not found: ${id}"`
- Some are generic: `"Unknown server error."`

**Impact:**  
- Poor developer experience
- Difficult to parse errors programmatically
- Inconsistent API documentation

**Fix Required:**  
Standardize all error messages to use consistent format and include error codes.

---

### 9. **Missing Input Validation for Metadata Fields**
**Severity:** MEDIUM  
**File:** `server.js`  
**Function:** `normalizeMetadata()`

**Issue:**  
Metadata fields like `user`, `project`, `memory_type` accept any string without validation:
- No length limits
- No character restrictions
- Could contain SQL injection attempts (for Postgres mode)
- Could contain path traversal attempts

**Impact:**  
- Potential security vulnerabilities
- Database corruption possible
- Storage issues with special characters

**Fix Required:**
```javascript
function validateMetadataField(value, maxLength = 255) {
  const normalized = normalizeText(value);
  if (normalized.length > maxLength) {
    throw new Error(`Metadata field exceeds maximum length of ${maxLength}`);
  }
  // Sanitize special characters
  return normalized.replace(/[<>\"']/g, '');
}
```

---

### 10. **Rate Limiting Uses Wall Clock Time**
**Severity:** MEDIUM  
**File:** `server.js`  
**Lines:** 485-500

**Issue:**  
Rate limiting uses `toISOString().slice(0, 16)` which creates minute buckets based on wall clock:
```javascript
const minuteKey = new Date().toISOString().slice(0, 16);
```

**Problems:**
- Clock skew can reset limits
- System time changes break rate limiting
- Not suitable for distributed deployments

**Impact:**  
- Rate limiting can be bypassed
- Inconsistent enforcement
- Not production-ready

**Fix Required:**  
Use sliding window or token bucket algorithm with monotonic time.

---

### 11. **Backup Rotation Race Condition**
**Severity:** MEDIUM  
**File:** `lib/stores/json-store.js`  
**Lines:** 28-42

**Issue:**  
`rotateBackups()` reads directory, sorts, and deletes files without locking:
```javascript
const files = fs.readdirSync(this.config.backupDir)
  .map((name) => ({ /* ... */ }))
  .sort((left, right) => right.stat.mtimeMs - left.stat.mtimeMs);

for (const file of files.slice(this.config.backupRetention)) {
  fs.unlinkSync(file.path);  // Not atomic
}
```

If multiple processes run simultaneously, backups can be corrupted.

**Impact:**  
- Backup corruption in concurrent scenarios
- Wrong backups deleted
- Data loss risk

**Fix Required:**  
Add file locking or use atomic operations.

---

### 12. **Missing CORS Configuration for Health Endpoints**
**Severity:** MEDIUM  
**File:** `server.js`  
**Lines:** 1180-1220

**Issue:**  
Health endpoints have hardcoded CORS headers:
```javascript
"Access-Control-Allow-Origin": "*",
"Access-Control-Allow-Methods": "GET, OPTIONS",
```

But:
- No OPTIONS preflight handling
- No credentials support
- Overly permissive `*` origin

**Impact:**  
- CORS errors in some browsers
- Security concerns with wildcard origin
- Preflight requests fail

**Fix Required:**  
Add proper CORS middleware with OPTIONS handling.

---

## 🟢 LOW PRIORITY ISSUES

### 13. **Hardcoded Temporary Directory Path**
**Severity:** LOW  
**File:** `scripts/verify.js`  
**Line:** 9

**Issue:**  
```javascript
const tempDir = mkdtempSync(path.join(process.env.TMPDIR || "/tmp", "memoryloom-verify-"));
```

Hardcoded `/tmp` doesn't work on Windows.

**Impact:**  
- Verification fails on Windows
- Cross-platform compatibility issue

**Fix Required:**
```javascript
import os from 'node:os';
const tempDir = mkdtempSync(path.join(os.tmpdir(), "memoryloom-verify-"));
```

---

### 14. **UI Health Check Doesn't Handle Network Errors**
**Severity:** LOW  
**File:** `ui/app.js`  
**Lines:** 88-110

**Issue:**  
```javascript
async function checkServerHealth() {
  try {
    const healthResponse = await fetch(`${serverUrl}/health`);
    const healthData = await healthResponse.json();
    // ...
  } catch (error) {
    // Generic error handling
  }
}
```

Doesn't distinguish between:
- Network errors
- Server errors (500)
- Timeout errors
- JSON parse errors

**Impact:**  
- Poor user feedback
- Can't diagnose connection issues

**Fix Required:**  
Add specific error handling for different failure modes.

---

### 15. **Missing Shebang Permissions Check**
**Severity:** LOW  
**Files:** `scripts/setup.js`, `scripts/verify.js`, `verify-deployment.js`

**Issue:**  
Files have `#!/usr/bin/env node` shebang but may not have execute permissions after git clone.

**Impact:**  
- Scripts may not be executable
- Users need to manually `chmod +x`

**Fix Required:**  
Document in README or add to setup script.

---

### 16. **Inconsistent Logging Levels**
**Severity:** LOW  
**File:** `server.js`  
**Function:** `writeLog()`

**Issue:**  
Some important events use `info` level when they should be `warn` or `error`:
- Rate limit exceeded → `error` (should be `warn`)
- Backup failures → not logged at all
- Connection errors → inconsistent levels

**Impact:**  
- Difficult to filter logs
- Important events missed
- Log noise

**Fix Required:**  
Audit all log calls and use appropriate levels.

---

### 17. **No Validation for Embedding Dimension**
**Severity:** LOW  
**File:** `server.js`  
**Line:** 46

**Issue:**  
```javascript
const EMBEDDING_DIMENSION = 64;
```

Hardcoded with no validation. If embeddings from storage have different dimensions, cosine similarity breaks.

**Impact:**  
- Migration issues
- Incorrect similarity scores
- Silent failures

**Fix Required:**  
Validate embedding dimensions on load and provide migration path.

---

### 18. **Missing Package.json Fields**
**Severity:** LOW  
**File:** `package.json`

**Issue:**  
Missing recommended fields:
- `repository` field (for npm)
- `bugs` field
- `homepage` field
- `engines` field (Node version requirement)
- `author` field

**Impact:**  
- Poor npm package metadata
- Users don't know Node version requirements
- Can't easily report bugs

**Fix Required:**
```json
{
  "engines": {
    "node": ">=18.0.0"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/bunnysayzz/memoryloom.git"
  },
  "bugs": {
    "url": "https://github.com/bunnysayzz/memoryloom/issues"
  },
  "homepage": "https://github.com/bunnysayzz/memoryloom#readme",
  "author": "bunnysayzz"
}
```

---

## 📋 DOCUMENTATION ISSUES

### 19. **README Claims CI Badge But No CI Workflow**
**Severity:** LOW  
**File:** `README.md`  
**Line:** 5

**Issue:**  
```markdown
[![CI](https://github.com/bunnysayzz/memoryloom/actions/workflows/ci.yml/badge.svg)]
```

But `.github/workflows/ci.yml` may not exist (folder is closed, couldn't verify).

**Impact:**  
- Broken badge
- False confidence in CI

**Fix Required:**  
Verify CI workflow exists or remove badge.

---

### 20. **Incorrect MCP Configuration Examples**
**Severity:** LOW  
**File:** `ui/index.html`, `README.md`

**Issue:**  
All examples show:
```json
{
  "command": "node",
  "args": ["/absolute/path/to/memoryloom/server.js"]
}
```

But users need to replace `/absolute/path/to/memoryloom/` with their actual path. This is confusing.

**Impact:**  
- Users copy-paste broken configs
- Support burden increases

**Fix Required:**  
Use placeholder like `<YOUR_PATH>` or provide platform-specific examples.

---

## 🔧 CODE QUALITY ISSUES

### 21. **Inconsistent Async/Await Usage**
**Severity:** LOW  
**File:** `server.js`

**Issue:**  
Mix of:
- `async/await`
- `.then()` chains
- `void` keyword for fire-and-forget

Example:
```javascript
process.on("SIGINT", () => {
  void shutdown("SIGINT");  // Using void
});
```

**Impact:**  
- Code inconsistency
- Harder to maintain
- Potential unhandled promise rejections

**Fix Required:**  
Standardize on async/await throughout.

---

### 22. **Magic Numbers Throughout Codebase**
**Severity:** LOW  
**File:** `server.js`

**Issue:**  
Hardcoded numbers without explanation:
- `0.45`, `0.35`, `0.2`, `0.1`, `-0.5` (scoring weights)
- `10 * 1024 * 1024` (buffer size)
- `100 * 1024` (content length)
- `2166136261`, `16777619` (FNV hash constants)

**Impact:**  
- Difficult to tune
- No explanation of choices
- Hard to maintain

**Fix Required:**  
Extract to named constants with comments explaining the values.

---

### 23. **No TypeScript Definitions**
**Severity:** LOW  
**File:** N/A

**Issue:**  
Project is JavaScript-only with no TypeScript definitions (`.d.ts` files).

**Impact:**  
- Poor IDE autocomplete
- No type safety
- Harder for TypeScript users to integrate

**Fix Required:**  
Add JSDoc comments or create `.d.ts` files.

---

### 24. **Duplicate Code in verify.js**
**Severity:** LOW  
**File:** `scripts/verify.js`  
**Lines:** 50-100, 105-155

**Issue:**  
The `createMcpClient()` function is defined, but then the same code is duplicated inline for the main test client.

**Impact:**  
- Code duplication
- Maintenance burden
- Inconsistency risk

**Fix Required:**  
Use `createMcpClient()` for main client too.

---

## 🛡️ SECURITY ISSUES

### 25. **API Key Stored in Plain Text**
**Severity:** MEDIUM  
**File:** `server.js`  
**Line:** 32

**Issue:**  
```javascript
apiKey: normalizeText(process.env.MEMORYLOOM_API_KEY || ""),
```

API key is stored in plain text in memory and compared using timing-safe comparison, but:
- No key rotation mechanism
- No key hashing at rest
- Logged in server status endpoint

**Impact:**  
- Key exposure risk
- No key management
- Compliance issues

**Fix Required:**  
- Hash keys at rest
- Implement key rotation
- Remove from status endpoint

---

### 26. **No Request Size Limits on Health Endpoint**
**Severity:** MEDIUM  
**File:** `server.js`  
**Lines:** 1180-1240

**Issue:**  
HTTP server has no request body size limits. Attacker can send huge requests.

**Impact:**  
- Memory exhaustion
- Denial of service
- Server crash

**Fix Required:**
```javascript
healthServer.on('request', (req, res) => {
  let body = '';
  let size = 0;
  const MAX_SIZE = 1024; // 1KB limit
  
  req.on('data', (chunk) => {
    size += chunk.length;
    if (size > MAX_SIZE) {
      req.destroy();
      res.writeHead(413);
      res.end('Request too large');
    }
  });
});
```

---

### 27. **Path Traversal Risk in UI Asset Serving**
**Severity:** MEDIUM  
**File:** `server.js`  
**Lines:** 360-385

**Issue:**  
```javascript
const requestPath = String(req.url || "/").split("?")[0] || "/";
const asset = UI_ASSETS[requestPath];
// ...
const assetPath = path.join(UI_DIR, asset.file);
```

While `UI_ASSETS` is a whitelist, there's no validation that `assetPath` stays within `UI_DIR`.

**Impact:**  
- Potential path traversal
- File disclosure risk

**Fix Required:**
```javascript
const assetPath = path.join(UI_DIR, asset.file);
const resolvedPath = path.resolve(assetPath);
if (!resolvedPath.startsWith(path.resolve(UI_DIR))) {
  return false; // Path traversal attempt
}
```

---

## 📊 PERFORMANCE ISSUES

### 28. **Inefficient Memory Search Algorithm**
**Severity:** MEDIUM  
**File:** `server.js`  
**Function:** `searchMemories()`

**Issue:**  
Search loads ALL memories into memory, scores ALL of them, then filters:
```javascript
const memories = await loadMemories();  // Loads everything
const matches = memories
  .filter((memory) => matchesFilters(memory, searchFilters))
  .map((memory) => ({ ...memory, relevance: scoreMemory(memory, query) }))
  .filter((memory) => memory.relevance > 0)
  .sort((left, right) => right.relevance - left.relevance)
  .slice(0, limit);
```

**Impact:**  
- O(n) complexity for every search
- Doesn't scale beyond 10k memories
- High memory usage

**Fix Required:**  
- Add indexing for metadata filters
- Use database queries for Postgres mode
- Implement pagination

---

### 29. **Synchronous File Operations in JSON Store**
**Severity:** MEDIUM  
**File:** `lib/stores/json-store.js`

**Issue:**  
Uses synchronous fs operations:
- `fs.readFileSync()`
- `fs.writeFileSync()`
- `fs.readdirSync()`
- `fs.statSync()`

**Impact:**  
- Blocks event loop
- Poor performance under load
- Server unresponsive during writes

**Fix Required:**  
Convert to async operations with `fs.promises`.

---

### 30. **No Connection Pooling for Postgres**
**Severity:** LOW  
**File:** `lib/stores/postgres-store.js`

**Issue:**  
While using `pg.Pool`, the pool configuration is minimal and doesn't optimize for performance.

**Impact:**  
- Suboptimal database performance
- Connection exhaustion possible

**Fix Required:**  
Add proper pool configuration with monitoring.

---

## 🧪 TESTING ISSUES

### 31. **No Unit Tests**
**Severity:** MEDIUM  
**File:** N/A

**Issue:**  
Project has no unit tests. Only has integration test in `verify.js`.

**Impact:**  
- Regressions not caught
- Refactoring risky
- Low confidence in changes

**Fix Required:**  
Add unit test framework (Jest/Vitest) and write tests.

---

### 32. **Verification Script Doesn't Test Postgres Mode**
**Severity:** LOW  
**File:** `scripts/verify.js`

**Issue:**  
Only tests JSON storage mode. Postgres mode is never verified.

**Impact:**  
- Postgres bugs not caught
- False confidence

**Fix Required:**  
Add Postgres verification tests.

---

## 📦 DEPLOYMENT ISSUES

### 33. **Dockerfile Exposes Unnecessary Ports**
**Severity:** LOW  
**File:** `Dockerfile`  
**Line:** 18

**Issue:**  
```dockerfile
EXPOSE 8080 10000
```

Port 10000 is never used anywhere in the codebase.

**Impact:**  
- Confusion
- Security surface

**Fix Required:**  
Remove unused port or document its purpose.

---

### 34. **No Health Check in Docker Compose**
**Severity:** LOW  
**File:** `docker-compose.yml`

**Issue:**  
No `healthcheck` configuration for the service.

**Impact:**  
- Docker doesn't know if service is healthy
- Orchestration issues

**Fix Required:**
```yaml
healthcheck:
  test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:8080/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

---

### 35. **Fly.io Config Missing Build Section**
**Severity:** LOW  
**File:** `fly.toml`  
**Line:** 5

**Issue:**  
```toml
[build]
```

Empty build section. Should specify Dockerfile or buildpacks.

**Impact:**  
- Deployment may fail
- Unclear build process

**Fix Required:**
```toml
[build]
  dockerfile = "Dockerfile"
```

---

## 🎯 SUMMARY

### Critical Issues: 3
1. Missing `parseToolResult` function (breaks verification)
2. Missing Netlify functions (breaks deployment)
3. Missing Azure template (breaks deployment)

### High Priority: 4
4. Silent error swallowing in write queue
5. Postgres connection error handling
6. Health endpoint memory leak
7. Unbounded embedding memory growth

### Medium Priority: 13
Issues 8-20

### Low Priority: 15
Issues 21-35

### Total Issues Found: 35

---

## 🚀 RECOMMENDED FIX PRIORITY

1. **Immediate (This Week):**
   - Fix #1: Add parseToolResult function
   - Fix #2: Create Netlify functions or remove from README
   - Fix #3: Create Azure template or remove button

2. **Short Term (This Month):**
   - Fix #4: Proper error handling in write queue
   - Fix #5: Postgres connection resilience
   - Fix #6: Health endpoint error handlers
   - Fix #7: Limit embedding n-grams

3. **Medium Term (Next Quarter):**
   - Add unit tests (#31)
   - Improve search performance (#28)
   - Add TypeScript definitions (#23)
   - Security hardening (#25-27)

4. **Long Term (Backlog):**
   - Code quality improvements
   - Documentation updates
   - Performance optimizations

---

**End of Report**
