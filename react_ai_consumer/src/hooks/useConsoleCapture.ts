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
const originals: Partial<Record<LogLevel, (...args: unknown[]) => void>> = {};
const listeners = new Set<() => void>();

function formatArgs(args: unknown[]): string {
  return args
    .map((a) => {
      if (typeof a === "string") return a;
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
      // Mutate in place — a fresh array per log entry is needless GC pressure
      // on low-end devices; subscribers copy on read instead (see the hook).
      entries.push({
        id: ++idCounter,
        level,
        timestamp: Date.now(),
        args: formatArgs(args),
      });
      if (entries.length > MAX_ENTRIES) entries.shift();
      notify();
    };
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
