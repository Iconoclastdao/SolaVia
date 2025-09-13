// pulse-main-extended.browser.mjs
// Browser-only PulseEngine and utilities with integrity logging (SHA-256 via Web Crypto API)

const nowIso = () => new Date().toISOString();
const sleep = ms => new Promise(res => setTimeout(res, ms));
const safeJSON = obj => {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
};

// Simple browser-safe hash (not cryptographic; kept for quick non-security uses)
function computeHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i);
    h |= 0;
  }
  return (h >>> 0).toString(16);
}

// --- stable JSON stringify (sort keys) ---
function stableStringify(obj) {
  if (obj === null || typeof obj !== "object") return JSON.stringify(obj);
  if (Array.isArray(obj)) return "[" + obj.map(stableStringify).join(",") + "]";
  const keys = Object.keys(obj).sort();
  return "{" + keys.map(k => JSON.stringify(k) + ":" + stableStringify(obj[k])).join(",") + "}";
}

// --- hex helper for WebCrypto digest results ---
async function sha256Hex(input) {
  const encoder = new TextEncoder();
  const data = typeof input === "string" ? encoder.encode(input) : (input instanceof Uint8Array ? input : encoder.encode(String(input)));
  const hashBuffer = await (crypto.subtle || window.crypto.subtle).digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// --- Logger ---
class Logger {
  constructor({ level = 'info', context = 'Browser' } = {}) {
    this.level = level;
    this.context = context;
    this.levels = { error: 0, warn: 1, info: 2, debug: 3 };
  }
  log(level, message, meta = {}) {
    if (this.levels[level] <= this.levels[this.level]) {
      console.log(`[${nowIso()}] ${level.toUpperCase()} [${this.context}] ${message}`, meta);
    }
  }
  error(msg, meta) { this.log('error', msg, meta); }
  warn(msg, meta) { this.log('warn', msg, meta); }
  info(msg, meta) { this.log('info', msg, meta); }
  debug(msg, meta) { this.log('debug', msg, meta); }
}

// --- CoreLoom (concurrency scheduler) ---
class CoreLoom {
  constructor({ logger, concurrency = 2 }) {
    this.logger = logger;
    this.concurrency = concurrency;
    this.queue = [];
    this.running = 0;
  }
  async schedule(taskFn) {
    if (this.running >= this.concurrency) {
      await new Promise(resolve => this.queue.push(resolve));
    }
    this.running++;
    try {
      return await taskFn();
    } finally {
      this.running--;
      if (this.queue.length) {
        const next = this.queue.shift();
        if (next) next();
      }
    }
  }
}

// --- PersistentCache (localStorage safe) ---
class PersistentCache {
  constructor({ logger, storageKey = 'pulse-cache' }) {
    this.logger = logger;
    this.storageKey = storageKey;
    try {
      const raw = typeof localStorage !== 'undefined'
        ? localStorage.getItem(storageKey)
        : '{}';
      this.cache = new Map(Object.entries(JSON.parse(raw || '{}')));
    } catch {
      this.cache = new Map();
    }
  }
  async get(key) { return this.cache.get(key); }
  async set(key, value, meta = {}) {
    this.cache.set(key, value);
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(Object.fromEntries(this.cache)));
    } catch (err) {
      this.logger && this.logger.warn && this.logger.warn('Failed to persist cache', { error: err.message });
    }
    this.logger && this.logger.info && this.logger.info('Cache updated', { key, meta });
  }
}

// --- EmbedderModule (browser-safe) ---
class EmbedderModule {
  constructor({ logger }) { this.logger = logger; }
  async compute(text) {
    this.logger && this.logger.debug && this.logger.debug('Embedding text', { length: text.length });
    const words = text.toLowerCase().split(/\W+/).filter(Boolean);
    const dim = 128;
    const vector = new Float32Array(dim);
    for (const word of words) {
      let hash = 0;
      for (let i = 0; i < word.length; i++) {
        hash = (hash * 31 + word.charCodeAt(i)) >>> 0;
      }
      vector[hash % dim] += 1;
    }
    const norm = Math.sqrt(vector.reduce((s, v) => s + v * v, 0)) || 1;
    for (let i = 0; i < dim; i++) vector[i] /= norm;
    return vector;
  }
}

// --- TokenizerModule ---
class TokenizerModule {
  constructor({ logger }) { this.logger = logger; }
  async tokenize(text) {
    this.logger && this.logger.debug && this.logger.debug('Tokenizing', { length: text.length });
    return text.split(/\s+/);
  }
}

// --- OllamaModule (with abort + retries) ---
class OllamaModule {
  constructor({ model, apiUrl, logger, maxRetries = 3, fallbackEnabled = true }) {
    this.model = model || "llama3";
    this.apiUrl = this.normalizeUrl(apiUrl);
    this.logger = logger;
    this.maxRetries = maxRetries;
    this.fallbackEnabled = fallbackEnabled;
  }

  normalizeUrl(apiUrl) {
    if (!apiUrl) return "http://localhost:11434/api/generate";
    if (apiUrl.endsWith("/")) apiUrl = apiUrl.slice(0, -1);
    if (!apiUrl.includes("/api/")) return apiUrl + "/api/generate";
    return apiUrl;
  }

  async compute(prompt, signal) {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        this.logger && this.logger.debug && this.logger.debug("Sending request to Ollama", {
          attempt, apiUrl: this.apiUrl,
          preview: prompt.slice(0, 80)
        });

        const res = await fetch(this.apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model: this.model, prompt, stream: false }),
          signal
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

        const data = await res.json();
        return { text: data.response || data.text || "" };
      } catch (err) {
        this.logger && this.logger.warn && this.logger.warn("Ollama request failed", { attempt, error: err?.message || String(err) });
        if (attempt === this.maxRetries && this.fallbackEnabled) {
          this.logger && this.logger.info && this.logger.info("Falling back to local processing");
          return { text: await this.localFallback(prompt, "", []) };
        }
        await sleep(500 * attempt);
      }
    }
    throw new Error("Ollama request failed after maximum retries");
  }

  async localFallback(description, prevContent, rules) {
    this.logger && this.logger.warn && this.logger.warn("Using local fallback", { description });
    return `// Local fallback for ${description}\n// Rules: ${rules.join(", ")}\n${prevContent || ""}`;
  }
}

// --- Telemetry ---
class Telemetry {
  constructor({ logger }) {
    this.logger = logger;
    this.records = [];
  }
  async record(event) {
    try {
      this.records.push({ ...event, ts: nowIso() });
      this.logger && this.logger.info && this.logger.info('Telemetry recorded', { type: event.type });
    } catch (err) {
      this.logger && this.logger.warn && this.logger.warn('Failed telemetry record', { error: err.message });
    }
  }
}

// --- PluginManager ---
class PluginManager {
  constructor(logger) { this.logger = logger; this.plugins = []; }
  register(plugin) {
    if (this.plugins.some(p => p.name === plugin.name)) {
      this.logger && this.logger.debug && this.logger.debug('Plugin already registered', { name: plugin.name });
      return;
    }
    this.plugins.push(plugin);
    this.logger && this.logger.info && this.logger.info('Plugin registered', { name: plugin.name });
  }
  async runHook(hook, ...args) {
    for (const plugin of this.plugins) {
      if (typeof plugin[hook] === 'function') {
        try {
          return await plugin[hook](...args);
        } catch (err) {
          this.logger && this.logger.warn && this.logger.warn(`Plugin ${plugin.name} ${hook} failed`, { error: err?.message || String(err) });
        }
      }
    }
  }
}

// --- JSONFlowConverterPlugin ---
function JSONFlowConverterPlugin({ logger }) {
  return {
    name: 'JSONFlowConverter',
    async afterGeneration(task, content) {
      try {
        const parsed = JSON.parse(content);
        if (parsed?.function && parsed?.steps) {
          logger && logger.info && logger.info('Already JSONFlow compliant', { file: task.outputFile });
          return content;
        }
      } catch { /* not JSON */ }
      logger && logger.warn && logger.warn('Conversion skipped in browser (no AJV available)');
      return content;
    }
  };
}

// --- PulseEngine (browser orchestrator) with hash-chained logs ---
class PulseEngine {
  constructor({
    logger,
    cacheKey = "pulse-cache",
    heartbeat = true,
    // Two Ollama endpoints by default
    ollamaUrls = [
      "http://localhost:11434/api/generate",
      "http://localhost:11435/api/generate"
    ],
    enableIntegrityLogs = true
  } = {}) {
    this.logger = logger || new Logger({ context: "PulseEngine" });
    this.loom = new CoreLoom({ logger: this.logger, concurrency: 2 });
    this.cache = new PersistentCache({ logger: this.logger, storageKey: cacheKey });
    this.embedder = new EmbedderModule({ logger: this.logger });
    this.tokenizer = new TokenizerModule({ logger: this.logger });
    this.abortControllers = [];

    this.ollama = ollamaUrls.map(
      (url, index) =>
        new OllamaModule({
          model: "llama3",
          apiUrl: url,
          logger: new Logger({ context: `Ollama-${index+1}`, level: this.logger.level }),
          maxRetries: 3,
          fallbackEnabled: true
        })
    );

    this.telemetry = new Telemetry({ logger: this.logger });
    this.plugins = new PluginManager(this.logger);
    this.listeners = {};

    // integrity logging state (stored in-memory; can be persisted externally if needed)
    this.enableIntegrityLogs = !!enableIntegrityLogs;
    // prevHashHex is a 64-character hex string (initially all zeros)
    this.prevHashHex = "0".repeat(64);
    this.integrityLog = []; // array of entries { timestamp, agent, input, output, prevHash }

    this.emit("log", "[Init] PulseEngine ready with " + this.ollama.length + " Ollama instances");
    this.plugins.register(JSONFlowConverterPlugin({ logger: this.logger }));
    if (heartbeat) this.startHeartbeat();
  }

  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }
  off(event, callback) {
    if (this.listeners[event])
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }
  emit(event, payload) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => {
        try { cb(payload); }
        catch (err) { console.error(`[PulseEngine] Error in listener`, err); }
      });
    }
  }

  startHeartbeat(intervalMs = 5000) {
    this.heartbeatTimer = setInterval(() =>
      this.emit("heartbeat", { ts: Date.now() }), intervalMs);
  }
  stopHeartbeat() { if (this.heartbeatTimer) clearInterval(this.heartbeatTimer); }

  // stable serializer for integrity entries
  static serializeEntry(entry) {
    // ensure deterministic field ordering
    return stableStringify({
      timestamp: entry.timestamp,
      agent: entry.agent,
      input: entry.input,
      output: entry.output,
      prevHash: entry.prevHash
    });
  }

  // write an integrity log entry (browser crypto)
  async _logEntry(agent, input, output) {
    if (!this.enableIntegrityLogs) return;
    try {
      const entry = {
        timestamp: nowIso(),
        agent,
        input: typeof input === "string" ? input : safeJSON(input),
        output: typeof output === "string" ? output : safeJSON(output),
        prevHash: this.prevHashHex
      };
      const serialized = PulseEngine.serializeEntry(entry);
      const entryHash = await sha256Hex(serialized);
      this.integrityLog.push(entry);
      this.prevHashHex = entryHash;
      // keep a lightweight log event for consumers
      this.emit("integrityLog", { entry, entryHash });
    } catch (err) {
      this.logger && this.logger.warn && this.logger.warn("Failed to append integrity log entry", { error: err?.message || String(err) });
    }
  }

  // verify integrity chain: returns true if ok
  async verifyLogChain() {
    if (!this.enableIntegrityLogs) return true;
    let expectedPrev = "0".repeat(64);
    for (let i = 0; i < this.integrityLog.length; i++) {
      const entry = this.integrityLog[i];
      if (entry.prevHash !== expectedPrev) {
        this.logger && this.logger.warn && this.logger.warn("Integrity mismatch at index", { index: i, expectedPrev, entryPrev: entry.prevHash });
        return false;
      }
      const serialized = PulseEngine.serializeEntry(entry);
      const hash = await sha256Hex(serialized);
      expectedPrev = hash;
    }
    return true;
  }

  async compute(prompt, index = 0) {
    if (!this.ollama[index]) {
      throw new Error(`No Ollama at index ${index}`);
    }
    const controller = new AbortController();
    this.abortControllers.push(controller);

    // call the Ollama client
    const result = await this.ollama[index].compute(prompt, controller.signal);

    // append integrity log (await to ensure chain order)
    await this._logEntry(`ollama-${index}`, prompt, result?.text ?? "");

    this.emit("dialogue", {
      index,
      apiUrl: this.ollama[index].apiUrl,
      prompt,
      reply: result.text,
      ts: nowIso()
    });
    return result;
  }

  async runTask({ id, prompt }) {
    try {
      this.emit("log", `Running task ${id}`);
      this.emit("progress", { step: 0, totalSteps: 4 });

      const tokens = await this.tokenizer.tokenize(prompt);
      this.emit("progress", { step: 1, totalSteps: 4 });

      const embedding = await this.embedder.compute(prompt);
      this.emit("progress", { step: 2, totalSteps: 4 });

      const result = await this.compute(prompt, 0);
      this.emit("progress", { step: 3, totalSteps: 4 });

      let finalOutput = result.text;
      finalOutput =
        (await this.plugins.runHook("afterGeneration", { id }, finalOutput)) || finalOutput;

      await this.cache.set(id, finalOutput, { tokens, embedding });
      await this.telemetry.record({ type: "task", id, tokens: tokens.length });

      this.emit("progress", { step: 4, totalSteps: 4 });
      this.emit("taskComplete", { id, output: finalOutput });
      return { output: finalOutput, tokens, embedding };
    } catch (err) {
      this.emit("error", { id, message: err.message });
      throw err;
    }
  }

  abort() {
    this.logger && this.logger.warn && this.logger.warn("Abort signal received");
    this.abortControllers.forEach(c => c.abort());
    this.abortControllers = [];
    this.emit("aborted");
  }

  // expose a snapshot of integrity log (non-blocking)
  getIntegritySnapshot() {
    return {
      prevHashHex: this.prevHashHex,
      entries: this.integrityLog.slice() // shallow copy
    };
  }

  // optional: persist integrity log to localStorage under a key
  async persistIntegrityLog(storageKey = "pulse-integrity-log") {
    try {
      const snapshot = this.getIntegritySnapshot();
      localStorage.setItem(storageKey, JSON.stringify(snapshot));
      this.logger && this.logger.info && this.logger.info("Integrity log persisted", { storageKey });
    } catch (err) {
      this.logger && this.logger.warn && this.logger.warn("Failed to persist integrity log", { error: err?.message || String(err) });
    }
  }

  // optional: restore from persisted integrity log
  async restoreIntegrityLog(storageKey = "pulse-integrity-log") {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return false;
      const obj = JSON.parse(raw);
      if (obj && obj.entries && Array.isArray(obj.entries)) {
        this.integrityLog = obj.entries;
        this.prevHashHex = obj.prevHashHex || "0".repeat(64);
        this.logger && this.logger.info && this.logger.info("Integrity log restored", { storageKey, entries: this.integrityLog.length });
        return true;
      }
      return false;
    } catch (err) {
      this.logger && this.logger.warn && this.logger.warn("Failed to restore integrity log", { error: err?.message || String(err) });
      return false;
    }
  }
}

export {
  Logger,
  CoreLoom,
  PersistentCache,
  EmbedderModule,
  TokenizerModule,
  OllamaModule,
  PluginManager,
  Telemetry,
  JSONFlowConverterPlugin,
  PulseEngine
};
