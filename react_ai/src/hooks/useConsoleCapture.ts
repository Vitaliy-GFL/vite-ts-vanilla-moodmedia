import { useEffect, useRef, useState, useCallback } from "react";

export type LogLevel = "log" | "warn" | "error";

export interface LogEntry {
  id: number;
  level: LogLevel;
  timestamp: number;
  args: string;
}

let idCounter = 0;

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

export function useConsoleCapture(enabled: boolean, maxEntries = 200) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const originalsRef = useRef<Record<LogLevel, (...args: unknown[]) => void> | null>(null);

  const clear = useCallback(() => setLogs([]), []);

  useEffect(() => {
    if (!enabled) return;

    if (originalsRef.current) return;

    const originals: Record<LogLevel, (...args: unknown[]) => void> = {
      log: console.log.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console),
    };
    originalsRef.current = originals;

    const levels: LogLevel[] = ["log", "warn", "error"];

    for (const level of levels) {
      console[level] = (...args: unknown[]) => {
        originals[level](...args);
        const entry: LogEntry = {
          id: ++idCounter,
          level,
          timestamp: Date.now(),
          args: formatArgs(args),
        };
        setLogs((prev) => {
          const next = [...prev, entry];
          return next.length > maxEntries ? next.slice(-maxEntries) : next;
        });
      };
    }

    return () => {
      for (const level of levels) {
        console[level] = originals[level]!;
      }
      originalsRef.current = null;
    };
  }, [enabled, maxEntries]);

  return { logs, clear };
}
