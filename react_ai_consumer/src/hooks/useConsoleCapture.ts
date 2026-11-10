import { useEffect, useState, useCallback } from "react";

export type LogLevel = "log" | "warn" | "error";

export interface LogEntry {
  id: number;
  level: LogLevel;
  timestamp: number;
  args: string;
}

const MAX_ENTRIES = 200;

let idCounter = 0;
let entries: LogEntry[] = [];
let installed = false;
let earlyErrorsTaken = false;
const originals: Partial<Record<LogLevel, (...args: unknown[]) => void>> = {};
const listeners = new Set<() => void>();

function formatArgs(args: unknown[]): string {
  return args
    .map((a) => {
      if (typeof a === "string") return a;
      if (a instanceof Error) {
        // Only V8 puts "Name: message" at the top of the stack.
        const stack = a.stack || "";
        return stack.includes(a.message) ? stack : `${a}\n${stack}`;
      }
      try {
        return JSON.stringify(a, null, 2);
      } catch {
        return String(a);
      }
    })
    .join(" ");
}

function notify(): void {
  for (const listener of listeners) listener();
}

function push(level: LogLevel, args: string): void {
  // Mutate in place — a fresh array per log entry is needless GC pressure
  // on low-end devices; subscribers copy on read instead (see the hook).
  entries.push({ id: ++idCounter, level, timestamp: Date.now(), args });
  if (entries.length > MAX_ENTRIES) entries.shift();
  notify();
}

// Captures console output for the whole template lifetime (not tied to a mounted
// component), so logs emitted before DebugModal appears are not lost. Call once
// as early as possible — see main.tsx.
export function installConsoleCapture(): void {
  if (installed) return;
  installed = true;

  const levels: LogLevel[] = ["log", "warn", "error"];

  for (const level of levels) {
    const original = console[level].bind(console);
    originals[level] = original;
    console[level] = (...args: unknown[]) => {
      original(...args);
      push(level, formatArgs(args));
    };
  }

  // Uncaught errors never go through console.* — the crash reporter in main.html hands them over,
  // including the ones it collected before the bundle ran (once: capture can be re-installed).
  const report = window.mvCrashReport;
  if (report) {
    if (!earlyErrorsTaken) {
      earlyErrorsTaken = true;
      for (const text of report.errors) push("error", text);
    }
    report.onError = (text) => push("error", text);
  }
}

// Restores the original console methods. Called once mframe params are known
// and debug is off, so production runs without any capture overhead.
export function uninstallConsoleCapture(): void {
  if (!installed) return;
  installed = false;

  for (const level of Object.keys(originals) as LogLevel[]) {
    console[level] = originals[level]!;
  }
  if (window.mvCrashReport) window.mvCrashReport.onError = null;
}

export function useConsoleCapture() {
  const [logs, setLogs] = useState<LogEntry[]>(() => [...entries]);

  useEffect(() => {
    // entries is mutated in place, so copy to give React a fresh reference.
    const listener = () => setLogs([...entries]);
    listeners.add(listener);
    listener();
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const clear = useCallback(() => {
    entries = [];
    notify();
  }, []);

  return { logs, clear };
}
