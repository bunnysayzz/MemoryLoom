import fs from "node:fs";
import path from "node:path";

export class JsonMemoryStore {
  constructor(config) {
    this.config = config;
    this.writeQueue = Promise.resolve();
  }

  ensureStorage() {
    fs.mkdirSync(this.config.dataDir, { recursive: true });
    if (this.config.backupOnWrite) {
      fs.mkdirSync(this.config.backupDir, { recursive: true });
    }
    if (!fs.existsSync(this.config.dataFile)) {
      fs.writeFileSync(this.config.dataFile, JSON.stringify({ memories: [] }, null, 2));
    }
  }

  loadMemories() {
    this.ensureStorage();
    const raw = fs.readFileSync(this.config.dataFile, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.memories) ? parsed.memories : [];
  }

  rotateBackups() {
    if (!this.config.backupOnWrite || !fs.existsSync(this.config.backupDir)) {
      return;
    }

    const files = fs
      .readdirSync(this.config.backupDir)
      .map((name) => ({
        name,
        path: path.join(this.config.backupDir, name),
        stat: fs.statSync(path.join(this.config.backupDir, name))
      }))
      .sort((left, right) => right.stat.mtimeMs - left.stat.mtimeMs);

    for (const file of files.slice(this.config.backupRetention)) {
      fs.unlinkSync(file.path);
    }
  }

  createBackupIfNeeded() {
    if (!this.config.backupOnWrite || !fs.existsSync(this.config.dataFile)) {
      return;
    }
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupPath = path.join(this.config.backupDir, `memories-${stamp}.json`);
    fs.copyFileSync(this.config.dataFile, backupPath);
    this.rotateBackups();
  }

  saveMemories(memories) {
    this.ensureStorage();
    this.createBackupIfNeeded();
    const payload = JSON.stringify({ memories }, null, 2);
    const tmpFile = `${this.config.dataFile}.${process.pid}.tmp`;
    fs.writeFileSync(tmpFile, payload);
    fs.renameSync(tmpFile, this.config.dataFile);
  }

  async initialize() {
    this.ensureStorage();
  }

  async list() {
    return this.loadMemories();
  }

  async replaceAll(memories) {
    const writePromise = this.writeQueue.then(async () => {
      this.saveMemories(memories);
    });
    this.writeQueue = writePromise.catch((error) => {
      console.error('Write queue error:', error);
      throw error;
    });
    await writePromise;
  }

  async status() {
    const memories = this.loadMemories();
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
