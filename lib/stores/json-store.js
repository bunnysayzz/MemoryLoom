import fs from "node:fs";
import { promises as fsPromises } from "node:fs";
import path from "node:path";

export class JsonMemoryStore {
  constructor(config) {
    this.config = config;
    this.writeQueue = Promise.resolve();
  }

  async ensureStorage() {
    await fsPromises.mkdir(this.config.dataDir, { recursive: true });
    if (this.config.backupOnWrite) {
      await fsPromises.mkdir(this.config.backupDir, { recursive: true });
    }
    try {
      await fsPromises.access(this.config.dataFile);
    } catch {
      await fsPromises.writeFile(this.config.dataFile, JSON.stringify({ memories: [] }, null, 2));
    }
  }

  async loadMemories() {
    await this.ensureStorage();
    const raw = await fsPromises.readFile(this.config.dataFile, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.memories) ? parsed.memories : [];
  }

  async rotateBackups() {
    if (!this.config.backupOnWrite) {
      return;
    }
    
    try {
      await fsPromises.access(this.config.backupDir);
    } catch {
      return;
    }

    const fileNames = await fsPromises.readdir(this.config.backupDir);
    const files = await Promise.all(
      fileNames.map(async (name) => {
        const filePath = path.join(this.config.backupDir, name);
        const stat = await fsPromises.stat(filePath);
        return { name, path: filePath, stat };
      })
    );
    
    files.sort((left, right) => right.stat.mtimeMs - left.stat.mtimeMs);

    for (const file of files.slice(this.config.backupRetention)) {
      await fsPromises.unlink(file.path);
    }
  }

  async createBackupIfNeeded() {
    if (!this.config.backupOnWrite) {
      return;
    }
    
    try {
      await fsPromises.access(this.config.dataFile);
    } catch {
      return;
    }
    
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupPath = path.join(this.config.backupDir, `memories-${stamp}.json`);
    await fsPromises.copyFile(this.config.dataFile, backupPath);
    await this.rotateBackups();
  }

  async saveMemories(memories) {
    await this.ensureStorage();
    await this.createBackupIfNeeded();
    const payload = JSON.stringify({ memories }, null, 2);
    const tmpFile = `${this.config.dataFile}.${process.pid}.tmp`;
    await fsPromises.writeFile(tmpFile, payload);
    await fsPromises.rename(tmpFile, this.config.dataFile);
  }

  async initialize() {
    await this.ensureStorage();
  }

  async list() {
    return this.loadMemories();
  }

  async replaceAll(memories) {
    const writePromise = this.writeQueue.then(async () => {
      await this.saveMemories(memories);
    });
    this.writeQueue = writePromise.catch((error) => {
      console.error('Write queue error:', error);
      throw error;
    });
    await writePromise;
  }

  async status() {
    const memories = await this.loadMemories();
    return {
      mode: "json",
      data_dir: this.config.dataDir,
      data_file: this.config.dataFile,
      backup_on_write: this.config.backupOnWrite,
      backup_retention: this.config.backupRetention,
      memory_count: memories.length
    };
  }

  async close() {}
}
