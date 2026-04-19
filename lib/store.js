import { JsonMemoryStore } from "./stores/json-store.js";
import { PostgresMemoryStore } from "./stores/postgres-store.js";

export function createMemoryStore(config) {
  if (config.storageMode === "postgres") {
    return new PostgresMemoryStore(config);
  }

  return new JsonMemoryStore(config);
}
