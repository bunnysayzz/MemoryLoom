#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const rootDir = process.cwd();
const dataDir = path.resolve(process.env.MEMORYLOOM_DATA_DIR || path.join(rootDir, "data"));
const dataFile = path.resolve(process.env.MEMORYLOOM_DATA_FILE || path.join(dataDir, "memories.json"));

fs.mkdirSync(dataDir, { recursive: true });

if (!fs.existsSync(dataFile)) {
  fs.writeFileSync(dataFile, JSON.stringify({ memories: [] }, null, 2));
}

const config = {
  mcpServers: {
    memoryloom: {
      command: "node",
      args: [path.join(rootDir, "server.js")]
    }
  }
};

process.stdout.write("MemoryLoom setup complete.\n\n");
process.stdout.write(`Data file: ${dataFile}\n\n`);
process.stdout.write("Suggested MCP client configuration:\n");
process.stdout.write(`${JSON.stringify(config, null, 2)}\n`);
