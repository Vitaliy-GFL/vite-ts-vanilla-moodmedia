type LogLevel = 'log' | 'error' | 'warn' | 'info' | 'debug';

export type LogEntry = {
  id: number;
  level: LogLevel;
  timestamp: number;
  args: unknown[];
};

type LogListener = (log: LogEntry) => void;

class ConsoleInterceptor {
  private listeners: Set<LogListener> = new Set();
  private logs: LogEntry[] = [];
  private logId = 0;
  private original: {
    log: typeof console.log;
    error: typeof console.error;
    warn: typeof console.warn;
    info: typeof console.info;
    debug: typeof console.debug;
  } | null = null;
  private intercepted = false;

  intercept() {
    if (this.intercepted) return;

    this.intercepted = true;
    this.original = {
      log: console.log.bind(console),
      error: console.error.bind(console),
      warn: console.warn.bind(console),
      info: console.info.bind(console),
      debug: console.debug.bind(console),
    };

    const intercept = (level: LogLevel) => {
      return (...args: unknown[]) => {
        const id = this.logId++;
        const entry: LogEntry = {
          id,
          level,
          timestamp: Date.now(),
          args,
        };

        this.logs.push(entry);
        this.listeners.forEach((listener) => listener(entry));
        this.original![level](...args);
      };
    };

    console.log = intercept('log');
    console.error = intercept('error');
    console.warn = intercept('warn');
    console.info = intercept('info');
    console.debug = intercept('debug');
  }

  restore() {
    if (!this.intercepted || !this.original) return;

    console.log = this.original.log;
    console.error = this.original.error;
    console.warn = this.original.warn;
    console.info = this.original.info;
    console.debug = this.original.debug;

    this.intercepted = false;
    this.original = null;
  }

  subscribe(listener: LogListener, includeExisting = false) {
    this.listeners.add(listener);
    
    // Optionally send all existing logs to the new listener
    if (includeExisting) {
      this.logs.forEach((log) => listener(log));
    }
    
    return () => {
      this.listeners.delete(listener);
    };
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clear() {
    this.logs = [];
    this.logId = 0;
  }
}

export default new ConsoleInterceptor();
