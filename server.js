#!/usr/bin/env node

import path from "node:path";
import { randomUUID, timingSafeEqual, createHash } from "node:crypto";
import process from "node:process";
import http from "node:http";
import fs from "node:fs";
import { createMemoryStore } from "./lib/store.js";

const SERVER_NAME = "memoryloom";
const SERVER_VERSION = "0.5.0";
const PROTOCOL_VERSION = "2024-11-05";
const DEFAULT_DATA_DIR = path.join(process.cwd(), "data");
const UI_DIR = path.join(process.cwd(), "ui");
const MAX_BUFFER_SIZE = 10 * 1024 * 1024; // 10MB max stdin buffer
const MAX_CONTENT_LENGTH = 100 * 1024; // 100KB max memory content
const MAX_METADATA_FIELD_LENGTH = 255; // Max length for metadata string fields
const API_KEY_FILE = ".api_key";
const UI_ASSETS = {
  "/": { file: "index.html", contentType: "text/html; charset=utf-8" },
  "/index.html": { file: "index.html", contentType: "text/html; charset=utf-8" },
  "/styles.css": { file: "styles.css", contentType: "text/css; charset=utf-8" },
  "/app.js": { file: "app.js", contentType: "application/javascript; charset=utf-8" },
  "/assets/memoryloom.png": { file: "assets/memoryloom.png", contentType: "image/png" }
};

const VALID_LOG_LEVELS = new Set(["debug", "info", "warn", "error"]);
const LOG_PRIORITIES = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

function getOrCreateApiKey(dataDir) {
  const apiKeyFile = path.join(dataDir, API_KEY_FILE);
  
  // Check if API key is set via environment variable
  if (process.env.MEMORYLOOM_API_KEY !== undefined) {
    const envKey = normalizeText(process.env.MEMORYLOOM_API_KEY);
    // Empty string means explicitly disable API key
    if (envKey === "") {
      return "";
    }
    return envKey;
  }
  
  // Try to load from file
  try {
    if (fs.existsSync(apiKeyFile)) {
      const storedKey = fs.readFileSync(apiKeyFile, "utf8").trim();
      if (storedKey) {
        return storedKey;
      }
    }
  } catch (e) {
    writeLog("warn", "Failed to load API key from file", { error: e.message });
  }
  
  // Generate new API key
  const newApiKey = randomUUID();
  
  // Ensure data directory exists
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(apiKeyFile, newApiKey, { mode: 0o600 });
    writeLog("info", "Generated new API key", { file: apiKeyFile });
  } catch (e) {
    writeLog("warn", "Failed to save API key to file", { error: e.message });
  }
  
  return newApiKey;
}

const CONFIG = {
  storageMode: normalizeText(process.env.MEMORYLOOM_STORAGE_MODE || "json").toLowerCase(),
  dataDir: path.resolve(process.env.MEMORYLOOM_DATA_DIR || DEFAULT_DATA_DIR),
  dataFile: "",
  backupDir: "",
  logLevel: normalizeText(process.env.MEMORYLOOM_LOG_LEVEL || "info").toLowerCase(),
  backupOnWrite: process.env.MEMORYLOOM_BACKUP_ON_WRITE === "true",
  backupRetention: parseIntegerInRange(process.env.MEMORYLOOM_BACKUP_RETENTION, 1, 1000, 5),
  postgresUrl: normalizeText(process.env.MEMORYLOOM_POSTGRES_URL || process.env.DATABASE_URL),
  apiKey: "", // Will be set after dataDir is resolved
  healthPort: parseIntegerInRange(process.env.MEMORYLOOM_HEALTH_PORT || process.env.PORT, 0, 65535, 0),
  maxToolCallsPerMinute: parseIntegerInRange(process.env.MEMORYLOOM_MAX_TOOL_CALLS_PER_MINUTE, 0, 1000000, 0),
  webUiEnabled: process.env.MEMORYLOOM_WEB_UI !== "false"
};
CONFIG.dataFile = path.resolve(process.env.MEMORYLOOM_DATA_FILE || path.join(CONFIG.dataDir, "memories.json"));
CONFIG.backupDir = path.join(CONFIG.dataDir, "backups");
CONFIG.apiKey = getOrCreateApiKey(CONFIG.dataDir);

const EMBEDDING_DIMENSION = 64;
const MAX_GRAMS = 1000;

if (!VALID_LOG_LEVELS.has(CONFIG.logLevel)) {
  CONFIG.logLevel = "info";
}
if (!new Set(["json", "postgres"]).has(CONFIG.storageMode)) {
  CONFIG.storageMode = "json";
}
if (!Number.isFinite(CONFIG.healthPort) || CONFIG.healthPort < 0 || CONFIG.healthPort > 65535) {
  CONFIG.healthPort = 0;
}

const store = createMemoryStore(CONFIG);
const toolCallWindow = {
  minute: 0,
  count: 0
};

function writeLog(level, message, details = {}) {
  if (LOG_PRIORITIES[level] < LOG_PRIORITIES[CONFIG.logLevel]) {
    return;
  }
  process.stderr.write(
    `${JSON.stringify({ timestamp: nowIso(), level, message, ...details })}\n`
  );
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeText(value) {
  return String(value || "").trim();
}

function clampNumber(value, minimum, maximum, fallback) {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return fallback;
  }
  return Math.max(minimum, Math.min(maximum, numeric));
}

function parseIntegerInRange(value, minimum, maximum, fallback) {
  const numeric = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.max(minimum, Math.min(maximum, numeric));
}

function toTokens(value) {
  return normalizeText(value)
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter(Boolean);
}

function buildSearchText(memory) {
  return [
    memory.content,
    (memory.metadata?.tags || []).join(" "),
    memory.metadata?.project || "",
    memory.metadata?.user || "",
    memory.metadata?.memory_type || ""
  ]
    .join(" ")
    .trim();
}

function hashToken(token) {
  let hash = 2166136261;
  for (let index = 0; index < token.length; index += 1) {
    hash ^= token.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

function normalizeVector(values) {
  const magnitude = Math.sqrt(values.reduce((sum, value) => sum + value * value, 0));
  if (magnitude === 0) {
    return values;
  }
  return values.map((value) => Number((value / magnitude).toFixed(6)));
}

function generateEmbedding(text) {
  const vector = new Array(EMBEDDING_DIMENSION).fill(0);
  const normalized = normalizeText(text).toLowerCase();
  const tokens = toTokens(normalized);
  const grams = [];

  for (const token of tokens) {
    if (grams.length >= MAX_GRAMS) {
      break;
    }
    grams.push(token);
    if (token.length > 2) {
      for (let index = 0; index <= token.length - 3; index += 1) {
        if (grams.length >= MAX_GRAMS) {
          break;
        }
        grams.push(token.slice(index, index + 3));
      }
    }
  }

  if (grams.length === 0 && normalized) {
    grams.push(normalized);
  }

  for (const gram of grams) {
    const hash = hashToken(gram);
    const bucket = hash % EMBEDDING_DIMENSION;
    const sign = hash % 2 === 0 ? 1 : -1;
    vector[bucket] += sign;
  }

  return normalizeVector(vector);
}

function cosineSimilarity(left, right) {
  if (!Array.isArray(left) || !Array.isArray(right) || left.length === 0 || right.length === 0) {
    return 0;
  }

  const length = Math.min(left.length, right.length);
  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;

  for (let index = 0; index < length; index += 1) {
    dot += left[index] * right[index];
    leftMagnitude += left[index] * left[index];
    rightMagnitude += right[index] * right[index];
  }

  if (leftMagnitude === 0 || rightMagnitude === 0) {
    return 0;
  }

  return dot / Math.sqrt(leftMagnitude * rightMagnitude);
}

function normalizeTags(value) {
  return Array.isArray(value) ? value.map((tag) => normalizeText(tag)).filter(Boolean) : [];
}

function normalizeMetadata(metadata = {}, existing = {}, options = {}) {
  const createdAt = existing.created_at || nowIso();
  const updatedAt = options.preserveUpdatedAt ? existing.updated_at || createdAt : nowIso();
  const lastAccessedAt = options.preserveLastAccessedAt
    ? existing.last_accessed_at || createdAt
    : existing.last_accessed_at || createdAt;
  const hasTags = Array.isArray(metadata.tags);
  
  const user = normalizeText(metadata.user) || existing.user || "default";
  const project = normalizeText(metadata.project) || existing.project || "general";
  const source = normalizeText(metadata.source) || existing.source || "manual";
  const memoryType = normalizeText(metadata.memory_type) || existing.memory_type || "general";
  const conflictKey = normalizeText(metadata.conflict_key) || existing.conflict_key || "";
  
  if (user.length > MAX_METADATA_FIELD_LENGTH) {
    throw new Error(`Metadata field 'user' exceeds maximum length of ${MAX_METADATA_FIELD_LENGTH} characters.`);
  }
  if (project.length > MAX_METADATA_FIELD_LENGTH) {
    throw new Error(`Metadata field 'project' exceeds maximum length of ${MAX_METADATA_FIELD_LENGTH} characters.`);
  }
  if (source.length > MAX_METADATA_FIELD_LENGTH) {
    throw new Error(`Metadata field 'source' exceeds maximum length of ${MAX_METADATA_FIELD_LENGTH} characters.`);
  }
  if (memoryType.length > MAX_METADATA_FIELD_LENGTH) {
    throw new Error(`Metadata field 'memory_type' exceeds maximum length of ${MAX_METADATA_FIELD_LENGTH} characters.`);
  }
  if (conflictKey.length > MAX_METADATA_FIELD_LENGTH) {
    throw new Error(`Metadata field 'conflict_key' exceeds maximum length of ${MAX_METADATA_FIELD_LENGTH} characters.`);
  }
  
  return {
    user,
    project,
    tags: hasTags ? normalizeTags(metadata.tags) : existing.tags || [],
    source,
    memory_type: memoryType,
    conflict_key: conflictKey,
    confidence: clampNumber(metadata.confidence ?? existing.confidence ?? 1, 0, 1, 1),
    created_at: createdAt,
    updated_at: updatedAt,
    last_accessed_at: lastAccessedAt,
    archived: typeof metadata.archived === "boolean" ? metadata.archived : Boolean(existing.archived)
  };
}

function hydrateMemory(raw) {
  const existingMetadata = raw.metadata && typeof raw.metadata === "object" ? raw.metadata : {};
  const content = normalizeText(raw.content);
  const metadata = normalizeMetadata(existingMetadata, existingMetadata, {
    preserveUpdatedAt: true,
    preserveLastAccessedAt: true
  });
  return {
    id: normalizeText(raw.id) || randomUUID(),
    content,
    embedding:
      Array.isArray(raw.embedding) && raw.embedding.length > 0
        ? raw.embedding
        : generateEmbedding(buildSearchText({ content, metadata })),
    importance: clampNumber(raw.importance ?? 0.5, 0, 1, 0.5),
    metadata
  };
}

function scoreMemory(memory, query) {
  const haystack = buildSearchText(memory).toLowerCase();
  const queryTokens = toTokens(query);
  const queryEmbedding = generateEmbedding(query);

  if (queryTokens.length === 0) {
    return 0;
  }

  let score = 0;
  for (const token of queryTokens) {
    if (haystack.includes(token)) {
      score += 1;
    }
  }

  const tokenScore = score / queryTokens.length;
  const semanticScore = Math.max(0, cosineSimilarity(memory.embedding, queryEmbedding));
  const importanceBoost = memory.importance * 0.2;
  const confidenceBoost = Number(memory.metadata?.confidence || 0) * 0.1;
  const archivedPenalty = memory.metadata?.archived ? -0.5 : 0;
  return Number(
    (tokenScore * 0.45 + semanticScore * 0.35 + importanceBoost + confidenceBoost + archivedPenalty).toFixed(3)
  );
}

function matchesFilters(memory, filters = {}) {
  if (filters.user && memory.metadata?.user !== filters.user) {
    return false;
  }
  if (filters.project && memory.metadata?.project !== filters.project) {
    return false;
  }
  if (filters.memory_type && memory.metadata?.memory_type !== filters.memory_type) {
    return false;
  }
  if (typeof filters.archived === "boolean" && memory.metadata?.archived !== filters.archived) {
    return false;
  }
  if (filters.tags && Array.isArray(filters.tags) && filters.tags.length > 0) {
    const memoryTags = new Set(memory.metadata?.tags || []);
    for (const tag of filters.tags) {
      if (!memoryTags.has(tag)) {
        return false;
      }
    }
  }
  return true;
}

function buildTextResult(payload) {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(payload, null, 2)
      }
    ]
  };
}

function tryServeWebUi(req, res) {
  if (!CONFIG.webUiEnabled || req.method !== "GET") {
    return false;
  }

  const requestPath = String(req.url || "/").split("?")[0] || "/";
  const asset = UI_ASSETS[requestPath];
  if (!asset) {
    return false;
  }

  const assetPath = path.join(UI_DIR, asset.file);
  if (!fs.existsSync(assetPath)) {
    return false;
  }

  try {
    const body = fs.readFileSync(assetPath);
    res.writeHead(200, {
      "Content-Type": asset.contentType,
      "Cache-Control": requestPath === "/" ? "no-cache" : "public, max-age=3600"
    });
    res.end(body);
    return true;
  } catch (error) {
    writeLog("error", "web_ui_serve_failure", {
      details: error instanceof Error ? error.message : "web ui read error"
    });
    return false;
  }
}

function validateAddMemory(args) {
  const content = normalizeText(args?.content);
  if (!content) {
    throw new Error("`content` is required.");
  }
  if (content.length > MAX_CONTENT_LENGTH) {
    throw new Error(`Content length ${content.length} exceeds maximum allowed size ${MAX_CONTENT_LENGTH}`);
  }

  return {
    content,
    importance: clampNumber(args?.importance ?? 0.5, 0, 1, 0.5),
    metadata: normalizeMetadata(args?.metadata || {})
  };
}

function validateMemoryId(id) {
  const value = normalizeText(id);
  if (!value) {
    throw new Error("A valid memory id is required.");
  }
  return value;
}

function canonicalTags(tags = []) {
  return [...new Set(normalizeTags(tags))].sort();
}

function buildConflictKey(memoryOrMetadata = {}) {
  const metadata = memoryOrMetadata.metadata && typeof memoryOrMetadata.metadata === "object"
    ? memoryOrMetadata.metadata
    : memoryOrMetadata;
  const keyParts = [
    normalizeText(metadata.user || "default").toLowerCase(),
    normalizeText(metadata.project || "general").toLowerCase(),
    normalizeText(metadata.memory_type || "general").toLowerCase()
  ];
  return keyParts.join("|");
}

function hashApiKey(key) {
  return createHash("sha256").update(key).digest();
}

function sanitizeToolArguments(args = {}) {
  const copy = { ...args };
  delete copy.api_key;
  return copy;
}

function authorizeToolCall(args = {}) {
  if (!CONFIG.apiKey) {
    return sanitizeToolArguments(args);
  }

  const token = normalizeText(args.api_key);
  const tokenHash = hashApiKey(token);
  const expectedHash = hashApiKey(CONFIG.apiKey);
  const valid = timingSafeEqual(tokenHash, expectedHash);

  if (!token || !valid) {
    throw new Error("Unauthorized tool call: invalid or missing api_key.");
  }

  return sanitizeToolArguments(args);
}

function enforceRateLimit() {
  if (!CONFIG.maxToolCallsPerMinute || CONFIG.maxToolCallsPerMinute <= 0) {
    return;
  }

  const now = Date.now();
  const minuteKey = Math.floor(now / 60000);
  if (toolCallWindow.minute !== minuteKey) {
    toolCallWindow.minute = minuteKey;
    toolCallWindow.count = 0;
  }

  toolCallWindow.count += 1;
  if (toolCallWindow.count > CONFIG.maxToolCallsPerMinute) {
    throw new Error("Rate limit exceeded for tool calls. Please retry in the next minute window.");
  }
}

function touchMemory(memory) {
  return {
    ...memory,
    metadata: {
      ...memory.metadata,
      last_accessed_at: nowIso()
    }
  };
}

async function loadMemories() {
  return (await store.list()).map((memory) => hydrateMemory(memory));
}

async function replaceMemories(memories) {
  await store.replaceAll(memories);
}

async function writeAndRespond(memories, payload) {
  await replaceMemories(memories);
  writeLog("info", "memory_store_updated", {
    totalMemories: memories.length,
    storageMode: CONFIG.storageMode
  });
  return buildTextResult(payload);
}

async function migrateMemories() {
  const memories = await store.list();
  
  // Quick check: if all memories already have embeddings, skip migration
  const allHaveEmbeddings = memories.every(
    (memory) => Array.isArray(memory.embedding) && memory.embedding.length > 0
  );
  if (allHaveEmbeddings) {
    return;
  }
  
  const hydrated = memories.map((memory) => hydrateMemory(memory));
  const before = JSON.stringify(memories);
  const after = JSON.stringify(hydrated);
  if (before !== after) {
    await store.replaceAll(hydrated);
  }
}

async function addMemory(args) {
  const memories = await loadMemories();
  const entry = {
    id: randomUUID(),
    content: args.content,
    embedding: generateEmbedding(buildSearchText({ content: args.content, metadata: args.metadata })),
    importance: args.importance,
    metadata: args.metadata
  };

  memories.push(entry);
  return writeAndRespond(memories, {
    ok: true,
    message: "Memory stored successfully.",
    memory: entry
  });
}

async function upsertMemory(args) {
  const validated = validateAddMemory(args);
  const memories = await loadMemories();
  const explicitConflictKey = normalizeText(args?.conflict_key);
  const targetKey = explicitConflictKey || buildConflictKey(validated.metadata);

  const existingIndex = memories.findIndex((memory) => {
    const memoryKey = normalizeText(memory.metadata?.conflict_key) || buildConflictKey(memory);
    return memoryKey === targetKey && !memory.metadata?.archived;
  });

  if (existingIndex >= 0) {
    const existing = memories[existingIndex];
    const mergedTags = canonicalTags([...(existing.metadata?.tags || []), ...(validated.metadata.tags || [])]);
    const updated = {
      ...existing,
      content: validated.content,
      importance: validated.importance,
      metadata: normalizeMetadata(
        {
          ...validated.metadata,
          tags: mergedTags,
          conflict_key: targetKey
        },
        existing.metadata
      )
    };
    updated.embedding = generateEmbedding(buildSearchText(updated));
    memories[existingIndex] = updated;
    return writeAndRespond(memories, {
      ok: true,
      action: "updated",
      memory: updated
    });
  }

  const entry = {
    id: randomUUID(),
    content: validated.content,
    embedding: generateEmbedding(buildSearchText({ content: validated.content, metadata: validated.metadata })),
    importance: validated.importance,
    metadata: {
      ...validated.metadata,
      conflict_key: targetKey
    }
  };
  memories.push(entry);
  return writeAndRespond(memories, {
    ok: true,
    action: "created",
    memory: entry
  });
}

async function listMemories(args) {
  const filters = args?.filters && typeof args.filters === "object" ? args.filters : {};
  const limit = parseIntegerInRange(args?.limit, 1, 100, 20);
  const sort = normalizeText(args?.sort || "updated_desc");

  let memories = (await loadMemories()).filter((memory) => matchesFilters(memory, filters));

  if (sort === "updated_asc") {
    memories = memories.sort((left, right) => left.metadata.updated_at.localeCompare(right.metadata.updated_at));
  } else if (sort === "created_asc") {
    memories = memories.sort((left, right) => left.metadata.created_at.localeCompare(right.metadata.created_at));
  } else if (sort === "created_desc") {
    memories = memories.sort((left, right) => right.metadata.created_at.localeCompare(left.metadata.created_at));
  } else {
    memories = memories.sort((left, right) => right.metadata.updated_at.localeCompare(left.metadata.updated_at));
  }

  return buildTextResult({
    ok: true,
    count: memories.slice(0, limit).length,
    memories: memories.slice(0, limit)
  });
}

async function searchMemories(args) {
  const query = normalizeText(args?.query);
  if (!query) {
    throw new Error("`query` is required.");
  }

  const filters = args?.filters && typeof args.filters === "object" ? args.filters : {};
  const limit = parseIntegerInRange(args?.limit, 1, 50, 5);
  const includeArchived = Boolean(args?.include_archived);

  const memories = await loadMemories();
  const searchFilters = { ...filters };
  if (typeof filters.archived !== "boolean") {
    searchFilters.archived = includeArchived ? undefined : false;
  }
  const matches = memories
    .filter((memory) => matchesFilters(memory, searchFilters))
    .map((memory) => ({
      ...memory,
      relevance: scoreMemory(memory, query)
    }))
    .filter((memory) => memory.relevance > 0)
    .sort((left, right) => right.relevance - left.relevance)
    .slice(0, limit);

  return buildTextResult({
    ok: true,
    query,
    count: matches.length,
    memories: matches
  });
}

async function getMemories(args) {
  const ids = Array.isArray(args?.ids) ? args.ids.map((id) => validateMemoryId(id)) : [];
  if (ids.length === 0) {
    throw new Error("`ids` must contain at least one memory id.");
  }

  const idSet = new Set(ids);
  const memories = await loadMemories();
  const found = memories.filter((memory) => idSet.has(memory.id)).map((memory) => touchMemory(memory));
  const touchedMap = new Map(found.map((memory) => [memory.id, memory]));
  const updated = memories.map((memory) => touchedMap.get(memory.id) || memory);
  await replaceMemories(updated);

  return buildTextResult({
    ok: true,
    requested: ids.length,
    found: found.length,
    memories: found
  });
}

async function updateMemory(args) {
  const id = validateMemoryId(args?.id);
  const content = args?.content === undefined ? undefined : normalizeText(args.content);
  const importance = args?.importance === undefined ? undefined : clampNumber(args.importance, 0, 1, 0.5);
  const metadataPatch = args?.metadata && typeof args.metadata === "object" ? args.metadata : null;

  if (content !== undefined && !content) {
    throw new Error("`content` cannot be empty when provided.");
  }
  if (content !== undefined && content.length > MAX_CONTENT_LENGTH) {
    throw new Error(`Content length ${content.length} exceeds maximum allowed size ${MAX_CONTENT_LENGTH}`);
  }

  const memories = await loadMemories();
  const index = memories.findIndex((memory) => memory.id === id);
  if (index === -1) {
    throw new Error(`Memory not found: ${id}`);
  }

  const existing = memories[index];
  const updated = {
    ...existing,
    content: content ?? existing.content,
    importance: importance ?? existing.importance,
    metadata: normalizeMetadata(metadataPatch || {}, existing.metadata)
  };
  updated.embedding = generateEmbedding(buildSearchText(updated));

  memories[index] = updated;
  return writeAndRespond(memories, {
    ok: true,
    message: "Memory updated successfully.",
    memory: updated
  });
}

async function deleteMemory(args) {
  const id = validateMemoryId(args?.id);
  const hardDelete = Boolean(args?.hard_delete);
  const memories = await loadMemories();
  const index = memories.findIndex((memory) => memory.id === id);
  if (index === -1) {
    throw new Error(`Memory not found: ${id}`);
  }

  if (hardDelete) {
    const [deleted] = memories.splice(index, 1);
    return writeAndRespond(memories, {
      ok: true,
      message: "Memory deleted permanently.",
      memory: deleted
    });
  }

  const archived = {
    ...memories[index],
    metadata: normalizeMetadata({ archived: true }, memories[index].metadata)
  };
  archived.embedding = generateEmbedding(buildSearchText(archived));
  memories[index] = archived;
  return writeAndRespond(memories, {
    ok: true,
    message: "Memory archived successfully.",
    memory: archived
  });
}

async function getStats() {
  const memories = await loadMemories();
  const archived = memories.filter((memory) => memory.metadata?.archived).length;
  const active = memories.length - archived;
  const byProject = {};
  const byType = {};

  for (const memory of memories) {
    const project = memory.metadata?.project || "general";
    const memoryType = memory.metadata?.memory_type || "general";
    byProject[project] = (byProject[project] || 0) + 1;
    byType[memoryType] = (byType[memoryType] || 0) + 1;
  }

  return buildTextResult({
    ok: true,
    stats: {
      total: memories.length,
      active,
      archived,
      by_project: byProject,
      by_type: byType
    }
  });
}

function summarizeMemories(memories = []) {
  const lines = memories
    .map((memory, index) => `${index + 1}. ${normalizeText(memory.content)}`)
    .filter(Boolean);
  return lines.join("\n");
}

async function consolidateMemories(args) {
  const filters = args?.filters && typeof args.filters === "object" ? args.filters : {};
  const minimumCount = parseIntegerInRange(args?.minimum_count, 2, 1000, 3);
  const archiveOriginals = args?.archive_originals !== false;

  const memories = await loadMemories();
  const candidates = memories
    .filter((memory) => !memory.metadata?.archived)
    .filter((memory) => matchesFilters(memory, filters))
    .sort((left, right) => right.metadata.updated_at.localeCompare(left.metadata.updated_at));

  if (candidates.length < minimumCount) {
    return buildTextResult({
      ok: true,
      consolidated: false,
      reason: "Not enough memories matched the consolidation criteria.",
      matched: candidates.length
    });
  }

  const summaryContent = summarizeMemories(candidates);
  const top = candidates[0];
  const mergedTags = canonicalTags(candidates.flatMap((memory) => memory.metadata?.tags || []));
  const consolidatedMemory = {
    id: randomUUID(),
    content: `Consolidated memory summary:\n${summaryContent}`,
    embedding: [],
    importance: clampNumber(
      candidates.reduce((sum, memory) => sum + Number(memory.importance || 0), 0) / candidates.length,
      0,
      1,
      0.7
    ),
    metadata: normalizeMetadata({
      ...top.metadata,
      tags: mergedTags,
      memory_type: "consolidated",
      source: "consolidation"
    })
  };
  consolidatedMemory.embedding = generateEmbedding(buildSearchText(consolidatedMemory));

  const candidateIds = new Set(candidates.map((memory) => memory.id));
  const updatedMemories = memories.map((memory) => {
    if (!candidateIds.has(memory.id) || !archiveOriginals) {
      return memory;
    }
    return {
      ...memory,
      metadata: normalizeMetadata(
        {
          archived: true,
          source: "consolidated"
        },
        memory.metadata
      )
    };
  });
  updatedMemories.push(consolidatedMemory);

  return writeAndRespond(updatedMemories, {
    ok: true,
    consolidated: true,
    consolidated_memory_id: consolidatedMemory.id,
    archived_count: archiveOriginals ? candidates.length : 0,
    source_count: candidates.length
  });
}

async function getServerStatus() {
  const storageStatus = await store.status();
  return buildTextResult({
    ok: true,
    status: {
      server: SERVER_NAME,
      version: SERVER_VERSION,
      protocol: PROTOCOL_VERSION,
      storage: storageStatus,
      embedding_dimension: EMBEDDING_DIMENSION,
      log_level: CONFIG.logLevel,
      auth_enabled: Boolean(CONFIG.apiKey)
    }
  });
}

const toolDefinitions = [
  {
    name: "add_memory",
    description: "Store a memory entry with metadata and importance.",
    inputSchema: {
      type: "object",
      properties: {
        content: { type: "string", description: "Text content to persist." },
        importance: { type: "number", minimum: 0, maximum: 1 },
        metadata: {
          type: "object",
          properties: {
            user: { type: "string" },
            project: { type: "string" },
            source: { type: "string" },
            memory_type: { type: "string" },
            confidence: { type: "number", minimum: 0, maximum: 1 },
            archived: { type: "boolean" },
            tags: { type: "array", items: { type: "string" } }
          }
        }
      },
      required: ["content"]
    }
  },
  {
    name: "search_memories",
    description: "Search stored memories using hybrid local embeddings, text matching, and metadata filters.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
        limit: { type: "number" },
        include_archived: { type: "boolean" },
        filters: {
          type: "object",
          properties: {
            user: { type: "string" },
            project: { type: "string" },
            memory_type: { type: "string" },
            archived: { type: "boolean" },
            tags: { type: "array", items: { type: "string" } }
          }
        }
      },
      required: ["query"]
    }
  },
  {
    name: "get_memories",
    description: "Fetch exact memory entries by id.",
    inputSchema: {
      type: "object",
      properties: {
        ids: {
          type: "array",
          items: { type: "string" }
        }
      },
      required: ["ids"]
    }
  },
  {
    name: "list_memories",
    description: "List memories with filters and sort order.",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number" },
        sort: { type: "string", enum: ["updated_desc", "updated_asc", "created_desc", "created_asc"] },
        filters: {
          type: "object",
          properties: {
            user: { type: "string" },
            project: { type: "string" },
            memory_type: { type: "string" },
            archived: { type: "boolean" },
            tags: { type: "array", items: { type: "string" } }
          }
        }
      }
    }
  },
  {
    name: "update_memory",
    description: "Update content, importance, or metadata for an existing memory.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        content: { type: "string" },
        importance: { type: "number", minimum: 0, maximum: 1 },
        metadata: {
          type: "object",
          properties: {
            user: { type: "string" },
            project: { type: "string" },
            source: { type: "string" },
            memory_type: { type: "string" },
            confidence: { type: "number", minimum: 0, maximum: 1 },
            archived: { type: "boolean" },
            tags: { type: "array", items: { type: "string" } }
          }
        }
      },
      required: ["id"]
    }
  },
  {
    name: "delete_memory",
    description: "Archive a memory by default, or permanently delete it when hard_delete is true.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        hard_delete: { type: "boolean" }
      },
      required: ["id"]
    }
  },
  {
    name: "memory_stats",
    description: "Return summary statistics for stored memories.",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "server_status",
    description: "Return runtime configuration and storage status for the MemoryLoom server.",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "upsert_memory",
    description: "Create or update memory by conflict key, user/project/type, and tags.",
    inputSchema: {
      type: "object",
      properties: {
        conflict_key: { type: "string" },
        content: { type: "string" },
        importance: { type: "number", minimum: 0, maximum: 1 },
        metadata: {
          type: "object",
          properties: {
            user: { type: "string" },
            project: { type: "string" },
            source: { type: "string" },
            memory_type: { type: "string" },
            confidence: { type: "number", minimum: 0, maximum: 1 },
            tags: { type: "array", items: { type: "string" } }
          }
        }
      },
      required: ["content"]
    }
  },
  {
    name: "consolidate_memories",
    description: "Consolidate multiple matching memories into one summary memory.",
    inputSchema: {
      type: "object",
      properties: {
        minimum_count: { type: "number" },
        archive_originals: { type: "boolean" },
        filters: {
          type: "object",
          properties: {
            user: { type: "string" },
            project: { type: "string" },
            memory_type: { type: "string" },
            tags: { type: "array", items: { type: "string" } }
          }
        }
      }
    }
  }
];

function withApiKeySchema(tool) {
  const inputSchema = tool.inputSchema && typeof tool.inputSchema === "object"
    ? tool.inputSchema
    : { type: "object", properties: {} };
  const properties =
    inputSchema.properties && typeof inputSchema.properties === "object"
      ? inputSchema.properties
      : {};

  return {
    ...tool,
    inputSchema: {
      ...inputSchema,
      type: "object",
      properties: {
        ...properties,
        api_key: {
          type: "string",
          description: "Optional API key. Required only when MEMORYLOOM_API_KEY is set on the server."
        }
      }
    }
  };
}

async function handleRequest(message) {
  switch (message.method) {
    case "initialize":
      return {
        protocolVersion: PROTOCOL_VERSION,
        serverInfo: {
          name: SERVER_NAME,
          version: SERVER_VERSION
        },
        capabilities: {
          tools: {}
        }
      };
    case "notifications/initialized":
      return null;
    case "tools/list":
      return { tools: toolDefinitions.map((tool) => withApiKeySchema(tool)) };
    case "tools/call": {
      const name = message.params?.name;
      enforceRateLimit();
      const args = authorizeToolCall(message.params?.arguments || {});

      if (name === "add_memory") {
        return addMemory(validateAddMemory(args));
      }
      if (name === "search_memories") {
        return searchMemories(args);
      }
      if (name === "get_memories") {
        return getMemories(args);
      }
      if (name === "list_memories") {
        return listMemories(args);
      }
      if (name === "update_memory") {
        return updateMemory(args);
      }
      if (name === "delete_memory") {
        return deleteMemory(args);
      }
      if (name === "memory_stats") {
        return getStats();
      }
      if (name === "server_status") {
        return getServerStatus();
      }
      if (name === "upsert_memory") {
        return upsertMemory(args);
      }
      if (name === "consolidate_memories") {
        return consolidateMemories(args);
      }
      throw new Error(`Unknown tool: ${name}`);
    }
    default:
      throw new Error(`Unsupported method: ${message.method}`);
  }
}

function writeMessage(payload) {
  const body = JSON.stringify(payload);
  const header = `Content-Length: ${Buffer.byteLength(body, "utf8")}\r\n\r\n`;
  process.stdout.write(header + body);
}

let buffer = Buffer.alloc(0);
let processing = Promise.resolve();

function processBuffer() {
  processing = processing.then(async () => {
    while (true) {
      const headerEnd = buffer.indexOf("\r\n\r\n");
      if (headerEnd === -1) {
        return;
      }

      const header = buffer.slice(0, headerEnd).toString("utf8");
      const match = header.match(/Content-Length:\s*(\d+)/i);
      if (!match) {
        throw new Error("Missing Content-Length header.");
      }

      const contentLength = Number(match[1]);
      if (contentLength > MAX_BUFFER_SIZE) {
        throw new Error(`Content-Length ${contentLength} exceeds maximum allowed size ${MAX_BUFFER_SIZE}`);
      }
      const messageStart = headerEnd + 4;
      const messageEnd = messageStart + contentLength;

      if (buffer.length < messageEnd) {
        return;
      }

      const rawMessage = buffer.slice(messageStart, messageEnd).toString("utf8");
      buffer = buffer.slice(messageEnd);
      
      let message;
      try {
        message = JSON.parse(rawMessage);
      } catch (parseError) {
        writeLog("error", "json_parse_error", { details: parseError instanceof Error ? parseError.message : "Invalid JSON" });
        continue;
      }
      
      const response = {
        jsonrpc: "2.0",
        id: message.id
      };

      try {
        const result = await handleRequest(message);
        if (message.id !== undefined && result !== null) {
          response.result = result;
          writeMessage(response);
        }
      } catch (error) {
        response.error = {
          code: -32000,
          message: error instanceof Error ? error.message : "Unknown server error."
        };
        if (message.id !== undefined) {
          writeMessage(response);
        }
      }
    }
  }).catch((error) => {
    writeLog("error", "process_buffer_failure", {
      details: error instanceof Error ? error.message : "unknown"
    });
  });
}

await store.initialize();
await migrateMemories();
writeLog("info", "memoryloom_server_started", {
  version: SERVER_VERSION,
  storageMode: CONFIG.storageMode,
  dataFile: CONFIG.dataFile,
  logLevel: CONFIG.logLevel
});

process.stdin.on("data", (chunk) => {
  if (buffer.length + chunk.length > MAX_BUFFER_SIZE) {
    writeLog("error", "stdin_buffer_overflow", {
      currentSize: buffer.length,
      chunkSize: chunk.length,
      maxSize: MAX_BUFFER_SIZE
    });
    process.exit(1);
  }
  buffer = Buffer.concat([buffer, chunk]);
  processBuffer();
});

process.stdin.on("error", (error) => {
  writeLog("error", "stdin_error", {
    details: error instanceof Error ? error.message : "stdin error"
  });
});

function checkAuth(req, res) {
  const authHeader = req.headers["authorization"] || req.headers["x-api-key"];
  if (!CONFIG.apiKey) {
    return true; // No API key configured, allow all requests
  }
  if (!authHeader) {
    res.writeHead(401, {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    });
    res.end(JSON.stringify({ ok: false, error: "unauthorized", message: "API key required" }));
    return false;
  }
  const providedKey = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (providedKey !== CONFIG.apiKey) {
    res.writeHead(403, {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    });
    res.end(JSON.stringify({ ok: false, error: "forbidden", message: "Invalid API key" }));
    return false;
  }
  return true;
}

let healthServer = null;
if (CONFIG.healthPort > 0) {
  healthServer = http.createServer(async (req, res) => {
    const url = req.url || "/";
    const route = String(url).split("?")[0] || "/";
    
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      res.writeHead(200, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key"
      });
      res.end();
      return;
    }
    
    // Serve UI assets if web UI is enabled
    if (CONFIG.webUiEnabled) {
      const asset = UI_ASSETS[route];
      if (asset) {
        const assetPath = path.join(UI_DIR, asset.file);
        if (fs.existsSync(assetPath)) {
          try {
            const body = fs.readFileSync(assetPath);
            res.writeHead(200, {
              "Content-Type": asset.contentType,
              "Cache-Control": route === "/" ? "no-cache" : "public, max-age=3600"
            });
            res.end(body);
            return;
          } catch (error) {
            writeLog("error", "web_ui_serve_failure", {
              details: error instanceof Error ? error.message : "web ui read error"
            });
          }
        }
      }
    }
    
    if (route === "/health" || route === "/ready") {
      // Health check endpoints are public (no auth required) for deployment platforms
      try {
        const status = await store.status();
        const payload = {
          ok: true,
          server: SERVER_NAME,
          version: SERVER_VERSION,
          storage: status
        };
        res.writeHead(200, {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key"
        });
        res.end(JSON.stringify(payload));
        return;
      } catch (error) {
        res.writeHead(503, {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        });
        res.end(JSON.stringify({
          ok: false,
          error: "service_unavailable",
          message: error instanceof Error ? error.message : "healthcheck_error"
        }));
        return;
      }
    }

    // API endpoint to get server info and API key for UI (no auth required for setup)
    if (route === "/api/setup-info") {
      try {
        // Determine the MCP URL based on the request
        const protocol = req.headers['x-forwarded-proto'] || req.headers['x-forwarded-protocol'] || 'http';
        const host = req.headers['x-forwarded-host'] || req.headers.host;
        const mcpUrl = `${protocol}://${host}/mcp`;
        
        const payload = {
          ok: true,
          server: SERVER_NAME,
          version: SERVER_VERSION,
          protocolVersion: PROTOCOL_VERSION,
          storageMode: CONFIG.storageMode,
          apiKey: CONFIG.apiKey,
          serverUrl: `${protocol}://${host}`,
          mcpUrl: mcpUrl
        };
        res.writeHead(200, {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        });
        res.end(JSON.stringify(payload));
        return;
      } catch (error) {
        res.writeHead(500, {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        });
        res.end(JSON.stringify({
          ok: false,
          error: "setup_info_error",
          message: error instanceof Error ? error.message : "Failed to get setup info"
        }));
        return;
      }
    }

    // HTTP MCP endpoint - allows remote MCP connections
    if (route === "/mcp" && req.method === "POST") {
      if (!checkAuth(req, res)) {
        return;
      }
      
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
        if (body.length > MAX_BUFFER_SIZE) {
          res.writeHead(413, {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          });
          res.end(JSON.stringify({
            jsonrpc: "2.0",
            error: {
              code: -32000,
              message: "Request body too large"
            }
          }));
          req.destroy();
        }
      });
      
      req.on("end", async () => {
        try {
          const message = JSON.parse(body);
          const response = {
            jsonrpc: "2.0",
            id: message.id
          };
          
          try {
            const result = await handleRequest(message);
            if (result !== null) {
              response.result = result;
            }
          } catch (error) {
            response.error = {
              code: -32000,
              message: error instanceof Error ? error.message : "Unknown server error."
            };
          }
          
          res.writeHead(200, {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key"
          });
          res.end(JSON.stringify(response));
        } catch (error) {
          res.writeHead(400, {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          });
          res.end(JSON.stringify({
            jsonrpc: "2.0",
            error: {
              code: -32700,
              message: "Parse error"
            }
          }));
        }
      });
      
      req.on("error", (error) => {
        writeLog("error", "mcp_request_error", {
          details: error instanceof Error ? error.message : "request error"
        });
      });
      
      return;
    }

    if (route === "/api/regenerate-api-key" && req.method === "POST") {
      try {
        const newApiKey = randomUUID();
        const apiKeyFile = path.join(CONFIG.dataDir, API_KEY_FILE);
        
        // Save new API key
        try {
          if (!fs.existsSync(CONFIG.dataDir)) {
            fs.mkdirSync(CONFIG.dataDir, { recursive: true });
          }
          fs.writeFileSync(apiKeyFile, newApiKey, { mode: 0o600 });
          CONFIG.apiKey = newApiKey;
          writeLog("info", "Regenerated API key", { file: apiKeyFile });
        } catch (e) {
          writeLog("warn", "Failed to save regenerated API key", { error: e.message });
        }
        
        const payload = {
          ok: true,
          apiKey: newApiKey
        };
        res.writeHead(200, {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        });
        res.end(JSON.stringify(payload));
        return;
      } catch (error) {
        res.writeHead(500, {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        });
        res.end(JSON.stringify({
          ok: false,
          error: "regenerate_api_key_error",
          message: error instanceof Error ? error.message : "Failed to regenerate API key"
        }));
        return;
      }
    }

    if (tryServeWebUi(req, res)) {
      return;
    }

    res.writeHead(404, {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    });
    res.end(JSON.stringify({ ok: false, error: "not_found" }));
  });

  healthServer.listen(CONFIG.healthPort, () => {
    writeLog("info", "health_endpoint_started", {
      port: CONFIG.healthPort
    });
  });

  healthServer.on('error', (error) => {
    writeLog("error", "health_server_error", {
      port: CONFIG.healthPort,
      details: error instanceof Error ? error.message : "health server error"
    });
    if (error.code === 'EADDRINUSE') {
      writeLog("error", "health_port_in_use", {
        port: CONFIG.healthPort,
        message: `Port ${CONFIG.healthPort} is already in use. Choose a different MEMORYLOOM_HEALTH_PORT.`
      });
      process.exit(1);
    }
  });
}

let shuttingDown = false;
async function shutdown(signal) {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;
  writeLog("info", "memoryloom_server_stopping", { signal });

  try {
    if (healthServer) {
      await new Promise((resolve) => {
        healthServer.close(() => resolve());
      });
    }
    if (typeof store.close === "function") {
      await store.close();
    }
  } catch (error) {
    writeLog("error", "shutdown_failure", {
      details: error instanceof Error ? error.message : "shutdown error"
    });
  } finally {
    process.exit(0);
  }
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});
