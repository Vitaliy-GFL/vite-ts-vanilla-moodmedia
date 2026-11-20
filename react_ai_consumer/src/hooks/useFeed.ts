import { useEffect, useState } from "react";

interface FeedOptions {
  // Poll interval; 0 fetches once. Default: 5 minutes.
  intervalMs?: number;
  // A request that takes longer is aborted and counts as a failure. Default: 30 s.
  timeoutMs?: number;
  // false holds the requests (e.g. until isStarted, or while a param is still empty).
  enabled?: boolean;
}

interface FeedState<T> {
  // Last successful response; kept when a later request fails.
  data: T | undefined;
  // Message of the last failure; cleared by the next success.
  error: string | undefined;
  // Date.now() of the last success.
  updatedAt: number | undefined;
}

// Polls a JSON feed. A path ("/feeds/…") is resolved against VITE_FEEDS_BASE: mood.local on
// the dev server, the production host in a build. A full URL is used as is.
// Failures are logged with console.warn, so they show up in the DebugModal.
export function useFeed<T>(
  path: string,
  { intervalMs = 300_000, timeoutMs = 30_000, enabled = true }: FeedOptions = {},
) {
  const [state, setState] = useState<FeedState<T>>({ data: undefined, error: undefined, updatedAt: undefined });
  const [statePath, setStatePath] = useState(path);

  // Data of another feed must not show under a new path (reset while rendering, so it never does).
  if (statePath !== path) {
    setStatePath(path);
    setState({ data: undefined, error: undefined, updatedAt: undefined });
  }

  useEffect(() => {
    if (!enabled || !path) return;

    const base = import.meta.env.VITE_FEEDS_BASE;
    const isFullUrl = /^https?:\/\//.test(path);
    if (!isFullUrl && !base) {
      const message = `VITE_FEEDS_BASE is not set for mode "${import.meta.env.MODE}" (add it to .env.${import.meta.env.MODE})`;
      console.error(`useFeed: ${message}`);
      setState((prev) => ({ ...prev, error: message }));
      return;
    }
    const url = isFullUrl ? path : base + (path.startsWith("/") ? "" : "/") + path;
    let cancelled = false;
    let controller: AbortController | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function load() {
      controller = new AbortController();
      const abortTimer = setTimeout(() => controller?.abort(), timeoutMs);
      try {
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as T;
        if (!cancelled) setState({ data, error: undefined, updatedAt: Date.now() });
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error && err.name === "AbortError" ? `timeout ${timeoutMs} ms` : String(err);
        console.warn(`useFeed: ${url} failed: ${message}`);
        setState((prev) => ({ ...prev, error: message }));
      } finally {
        clearTimeout(abortTimer);
      }
      // The next request is scheduled only after this one ends, so they never overlap.
      if (!cancelled && intervalMs > 0) timer = setTimeout(load, intervalMs);
    }

    load();

    return () => {
      cancelled = true;
      clearTimeout(timer);
      controller?.abort();
    };
  }, [path, intervalMs, timeoutMs, enabled]);

  return state;
}
