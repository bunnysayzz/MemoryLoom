#!/usr/bin/env node

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { mkdtempSync, rmSync } from "node:fs";

const rootDir = process.cwd();
const tempDir = mkdtempSync(path.join(process.env.TMPDIR || "/tmp", "memoryloom-verify-"));
const dataDir = tempDir;
const dataFile = path.join(dataDir, "memories.json");

fs.mkdirSync(dataDir, { recursive: true });
fs.writeFileSync(dataFile, JSON.stringify({ memories: [] }, null, 2));

function encode(message) {
  const body = JSON.stringify(message);
  return `Content-Length: ${Buffer.byteLength(body, "utf8")}\r\n\r\n${body}`;
}

function readMessage(buffer) {
  const headerEnd = buffer.indexOf("\r\n\r\n");
  if (headerEnd === -1) {
    return { message: null, remaining: buffer };
  }

  const header = buffer.slice(0, headerEnd).toString("utf8");
  const match = header.match(/Content-Length:\s*(\d+)/i);
  if (!match) {
    return { message: null, remaining: buffer };
  }

  const contentLength = Number(match[1]);
  const start = headerEnd + 4;
  const end = start + contentLength;
  if (buffer.length < end) {
    return { message: null, remaining: buffer };
  }

  const body = buffer.slice(start, end).toString("utf8");
  const remaining = buffer.slice(end);
  return { message: JSON.parse(body), remaining };
}

function parseToolResult(response) {
  if (response.error) {
    throw new Error(response.error.message || 'Tool call failed');
  }
  if (!response.result || !response.result.content || !response.result.content[0]) {
    throw new Error('Invalid tool response format');
  }
  return JSON.parse(response.result.content[0].text);
}

function createMcpClient(extraEnv = {}) {
  const client = spawn("node", ["server.js"], {
    cwd: rootDir,
    env: {
      ...process.env,
      MEMORYLOOM_DATA_DIR: tempDir,
      ...extraEnv
    },
    stdio: ["pipe", "pipe", "inherit"]
  });
  let buffer = Buffer.alloc(0);
  const responses = new Map();

  client.stdout.on("data", (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);
    while (true) {
      const { message, remaining } = readMessage(buffer);
      buffer = remaining;
      if (!message) {
        break;
      }
      responses.set(message.id, message);
    }
  });

  function send(id, method, params = {}) {
    client.stdin.write(
      encode({
        jsonrpc: "2.0",
        id,
        method,
        params
      })
    );
  }

  function waitFor(id, timeoutMs = 2000) {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const timer = setInterval(() => {
        if (responses.has(id)) {
          clearInterval(timer);
          resolve(responses.get(id));
          return;
        }
        if (Date.now() - start > timeoutMs) {
          clearInterval(timer);
          reject(new Error(`Timed out waiting for response ${id}`));
        }
      }, 10);
    });
  }

  return { client, send, waitFor };
}

const child = spawn("node", ["server.js"], {
  cwd: rootDir,
  env: {
    ...process.env,
    MEMORYLOOM_DATA_DIR: tempDir
  },
  stdio: ["pipe", "pipe", "inherit"]
});

child.on('error', (err) => {
  console.error('Failed to start server process:', err);
  rmSync(tempDir, { recursive: true, force: true });
  process.exit(1);
});

let buffer = Buffer.alloc(0);
const responses = new Map();

child.stdout.on("data", (chunk) => {
  buffer = Buffer.concat([buffer, chunk]);
  while (true) {
    const { message, remaining } = readMessage(buffer);
    buffer = remaining;
    if (!message) {
      break;
    }
    responses.set(message.id, message);
  }
});

function send(id, method, params = {}) {
  child.stdin.write(
    encode({
      jsonrpc: "2.0",
      id,
      method,
      params
    })
  );
}

function waitFor(id, timeoutMs = 2000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const timer = setInterval(() => {
      if (responses.has(id)) {
        clearInterval(timer);
        resolve(responses.get(id));
        return;
      }
      if (Date.now() - start > timeoutMs) {
        clearInterval(timer);
        reject(new Error(`Timed out waiting for response ${id}`));
      }
    }, 10);
  });
}

try {
  send(1, "initialize", {});
  send(2, "tools/list", {});
  const initializeResponse = await waitFor(1);
  const toolsResponse = await waitFor(2);

  if (initializeResponse.result.serverInfo.name !== "memoryloom") {
    throw new Error("Unexpected server name from initialize response.");
  }

  const toolNames = toolsResponse.result.tools.map((tool) => tool.name);
  const requiredTools = [
    "add_memory",
    "search_memories",
    "get_memories",
    "list_memories",
    "update_memory",
    "delete_memory",
    "memory_stats",
    "server_status",
    "upsert_memory",
    "consolidate_memories"
  ];
  for (const toolName of requiredTools) {
    if (!toolNames.includes(toolName)) {
      throw new Error(`Missing tool: ${toolName}`);
    }
  }
  for (const tool of toolsResponse.result.tools) {
    const apiKeyField = tool?.inputSchema?.properties?.api_key;
    if (!apiKeyField || apiKeyField.type !== "string") {
      throw new Error(`Tool schema missing api_key field: ${tool.name}`);
    }
  }

  send(3, "tools/call", {
    name: "add_memory",
    arguments: {
      content: "User prefers concise technical summaries",
      importance: 0.9,
      metadata: {
        user: "demo-user",
        project: "memoryloom",
        memory_type: "preference",
        tags: ["style", "summary"],
        confidence: 0.95
      }
    }
  });
  const addResult = parseToolResult(await waitFor(3));
  const memoryId = addResult.memory.id;
  if (!Array.isArray(addResult.memory.embedding) || addResult.memory.embedding.length === 0) {
    throw new Error("Memory add did not generate an embedding.");
  }

  send(4, "tools/call", {
    name: "update_memory",
    arguments: {
      id: memoryId,
      content: "User prefers concise technical summaries with examples",
      metadata: {
        tags: ["style", "summary", "examples"],
        confidence: 0.99
      }
    }
  });
  const updateResult = parseToolResult(await waitFor(4));
  if (!updateResult.memory.content.includes("examples")) {
    throw new Error("Memory update did not apply.");
  }

  send(42, "tools/call", {
    name: "upsert_memory",
    arguments: {
      content: "User prefers concise technical summaries with practical examples",
      metadata: {
        user: "demo-user",
        project: "memoryloom",
        memory_type: "preference",
        tags: ["style", "summary"]
      }
    }
  });
  const upsertResult = parseToolResult(await waitFor(42));
  if (upsertResult.action !== "updated") {
    throw new Error("Upsert did not update an existing matching memory.");
  }

  send(41, "tools/call", {
    name: "update_memory",
    arguments: {
      id: memoryId,
      metadata: {
        tags: []
      }
    }
  });
  const clearTagsResult = parseToolResult(await waitFor(41));
  if (clearTagsResult.memory.metadata.tags.length !== 0) {
    throw new Error("Memory update did not allow clearing tags.");
  }

  send(5, "tools/call", {
    name: "search_memories",
    arguments: {
      query: "technical summaries examples",
      filters: {
        project: "memoryloom",
        memory_type: "preference"
      }
    }
  });
  const searchResult = parseToolResult(await waitFor(5));
  if (searchResult.count < 1) {
    throw new Error("Search returned no memories.");
  }
  if (typeof searchResult.memories[0].relevance !== "number") {
    throw new Error("Search did not return ranked relevance values.");
  }

  send(51, "tools/call", {
    name: "add_memory",
    arguments: {
      content: "Consolidation candidate one",
      metadata: {
        user: "consolidator",
        project: "memoryloom",
        memory_type: "note",
        tags: ["consolidation"]
      }
    }
  });
  await waitFor(51);
  send(52, "tools/call", {
    name: "add_memory",
    arguments: {
      content: "Consolidation candidate two",
      metadata: {
        user: "consolidator",
        project: "memoryloom",
        memory_type: "note",
        tags: ["consolidation"]
      }
    }
  });
  await waitFor(52);
  send(53, "tools/call", {
    name: "add_memory",
    arguments: {
      content: "Consolidation candidate three",
      metadata: {
        user: "consolidator",
        project: "memoryloom",
        memory_type: "note",
        tags: ["consolidation"]
      }
    }
  });
  await waitFor(53);

  send(54, "tools/call", {
    name: "consolidate_memories",
    arguments: {
      minimum_count: 3,
      archive_originals: true,
      filters: {
        user: "consolidator",
        project: "memoryloom",
        memory_type: "note"
      }
    }
  });
  const consolidationResult = parseToolResult(await waitFor(54));
  if (!consolidationResult.consolidated) {
    throw new Error("Consolidation did not produce a summary memory.");
  }

  send(6, "tools/call", {
    name: "list_memories",
    arguments: {
      filters: {
        project: "memoryloom",
        user: "demo-user",
        memory_type: "preference"
      }
    }
  });
  const listResult = parseToolResult(await waitFor(6));
  if (listResult.count < 1) {
    throw new Error("List returned an unexpected number of memories.");
  }

  send(7, "tools/call", {
    name: "memory_stats",
    arguments: {}
  });
  const statsResult = parseToolResult(await waitFor(7));
  if (statsResult.stats.total < 1) {
    throw new Error("Stats returned an unexpected total count.");
  }

  send(71, "tools/call", {
    name: "server_status",
    arguments: {}
  });
  const serverStatusResult = parseToolResult(await waitFor(71));
  if (serverStatusResult.status.server !== "memoryloom") {
    throw new Error("Server status did not return the expected server name.");
  }
  if (serverStatusResult.status.storage.mode !== "json") {
    throw new Error("Server status did not return the expected storage mode.");
  }

  send(8, "tools/call", {
    name: "delete_memory",
    arguments: {
      id: memoryId
    }
  });
  const archiveResult = parseToolResult(await waitFor(8));
  if (archiveResult.memory.metadata.archived !== true) {
    throw new Error("Archive delete did not mark the memory as archived.");
  }

  send(9, "tools/call", {
    name: "delete_memory",
    arguments: {
      id: memoryId,
      hard_delete: true
    }
  });
  await waitFor(9);

  const finalData = JSON.parse(fs.readFileSync(dataFile, "utf8"));
  if (finalData.memories.some((memory) => memory.id === memoryId)) {
    throw new Error("Hard delete did not remove the target memory from storage.");
  }

  const preservedTimestampData = {
    memories: [
      {
        id: "preserve-test",
        content: "Timestamp migration should not rewrite this record",
        embedding: [],
        importance: 0.7,
        metadata: {
          user: "demo-user",
          project: "memoryloom",
          tags: [],
          source: "manual",
          memory_type: "test",
          confidence: 0.8,
          created_at: "2026-01-01T00:00:00.000Z",
          updated_at: "2026-01-02T00:00:00.000Z",
          last_accessed_at: "2026-01-03T00:00:00.000Z",
          archived: false
        }
      }
    ]
  };
  fs.writeFileSync(dataFile, JSON.stringify(preservedTimestampData, null, 2));

  const restartSession = createMcpClient();
  restartSession.send(101, "initialize", {});
  await restartSession.waitFor(101);
  restartSession.client.kill();

  const postRestartData = JSON.parse(fs.readFileSync(dataFile, "utf8"));
  const preservedMemory = postRestartData.memories[0];
  if (preservedMemory.metadata.updated_at !== "2026-01-02T00:00:00.000Z") {
    throw new Error("Server startup rewrote existing updated_at timestamps.");
  }

  const authSession = createMcpClient({
    MEMORYLOOM_API_KEY: "verify-secret"
  });
  authSession.send(201, "initialize", {});
  await authSession.waitFor(201);
  authSession.send(202, "tools/call", {
    name: "memory_stats",
    arguments: {}
  });
  const unauthorizedResponse = await authSession.waitFor(202);
  if (!unauthorizedResponse.error || !String(unauthorizedResponse.error.message || "").includes("Unauthorized")) {
    throw new Error("API key mode did not reject unauthorized tool calls.");
  }

  authSession.send(203, "tools/call", {
    name: "memory_stats",
    arguments: {
      api_key: "verify-secret"
    }
  });
  const authorizedResponse = await authSession.waitFor(203);
  if (!authorizedResponse.result) {
    throw new Error("API key mode did not allow authorized tool calls.");
  }
  authSession.client.kill();

  fs.writeFileSync(dataFile, JSON.stringify({ memories: [] }, null, 2));

  process.stdout.write("MemoryLoom verification passed.\n");
  child.kill();
  rmSync(tempDir, { recursive: true, force: true });
} catch (error) {
  child.kill();
  rmSync(tempDir, { recursive: true, force: true });
  process.stderr.write(`${error instanceof Error ? error.message : "Verification failed."}\n`);
  process.exit(1);
}
