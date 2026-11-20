// Request log: every fetch / XMLHttpRequest of the template and every <img>, <video>, <script>
// and <link> load, the last MAX_RECORDS of them. A failure also goes to console.warn, so it
// reaches DebugModal and remote debug unasked; the full list is the remote "requests" command.
// Imported first in main.tsx: it must wrap fetch and XHR before the Loader loads mframe.json.

export interface RequestRecord {
  t: number;
  kind: "fetch" | "xhr" | "img" | "video" | "audio" | "script" | "css";
  method?: string;
  url: string;
  ok: boolean;
  status?: number;
  ms?: number;
  // The status and the start of the body, or the network reason.
  error?: string;
}

const MAX_RECORDS = 100;
const BODY_CHARS = 500;
const records: RequestRecord[] = [];

// Remote debug's own requests would log themselves in a loop.
const LOGS_BASE = import.meta.env.VITE_LOGS_BASE;

function absolute(url: string): string {
  try {
    return new URL(url, location.href).href;
  } catch {
    return url;
  }
}

function skip(url: string): boolean {
  return (!!LOGS_BASE && url.startsWith(LOGS_BASE)) || url.startsWith("data:") || url.startsWith("blob:");
}

// `quiet`: recorded, not warned (a caller's own abort is not a failure to chase).
function record(r: RequestRecord, quiet = false): void {
  records.push(r);
  if (records.length > MAX_RECORDS) records.shift();
  if (!r.ok && !quiet) console.warn(`Request failed: ${r.method ?? r.kind} ${r.url} → ${r.error}`);
}

// The last requests, oldest first.
export function getRequests(): RequestRecord[] {
  return records.slice();
}

function since(start: number): number {
  return Math.round(performance.now() - start);
}

function wrapFetch(): void {
  const original = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = absolute(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
    if (skip(url)) return original(input, init);
    const method = (init?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
    const t = Date.now();
    const start = performance.now();
    try {
      const res = await original(input, init);
      const ms = since(start);
      if (res.ok) {
        record({ t, kind: "fetch", method, url, ok: true, status: res.status, ms });
      } else {
        // Read from a clone and without waiting: the caller gets the response as it is.
        res
          .clone()
          .text()
          .catch(() => "")
          .then((body) =>
            record({
              t,
              kind: "fetch",
              method,
              url,
              ok: false,
              status: res.status,
              ms,
              error: `${res.status}${body ? ": " + body.slice(0, BODY_CHARS) : ""}`,
            }),
          );
      }
      return res;
    } catch (err) {
      const aborted = err instanceof Error && err.name === "AbortError";
      // Chrome says only "Failed to fetch" for a dead network, a refused connection and CORS alike.
      const reason = aborted
        ? "aborted (timeout?)"
        : `network error or CORS (${String((err as Error)?.message ?? err)})`;
      record({ t, kind: "fetch", method, url, ok: false, ms: since(start), error: reason });
      throw err;
    }
  };
}

function wrapXhr(): void {
  const proto = XMLHttpRequest.prototype;
  const open = proto.open;
  const send = proto.send;
  const info = new WeakMap<XMLHttpRequest, { method: string; url: string }>();

  proto.open = function (this: XMLHttpRequest, method: string, url: string | URL, ...rest: unknown[]) {
    info.set(this, { method: String(method).toUpperCase(), url: absolute(String(url)) });
    return (open as (...args: unknown[]) => void).apply(this, [method, url, ...rest]);
  } as typeof proto.open;

  proto.send = function (this: XMLHttpRequest, body?: Document | XMLHttpRequestBodyInit | null) {
    const req = info.get(this);
    if (req && !skip(req.url)) {
      const t = Date.now();
      const start = performance.now();
      let ended: "abort" | "timeout" | undefined;
      this.addEventListener("abort", () => (ended = "abort"));
      this.addEventListener("timeout", () => (ended = "timeout"));
      this.addEventListener("loadend", () => {
        const base = { t, kind: "xhr" as const, method: req.method, url: req.url, ms: since(start) };
        // A file:// load that worked has status 0 too (Tizen loads mframe.json that way).
        const fileOk = this.status === 0 && req.url.startsWith("file:") && !ended && this.readyState === 4;
        if ((this.status >= 200 && this.status < 400) || fileOk) {
          record({ ...base, ok: true, status: this.status });
        } else if (ended === "abort") {
          record({ ...base, ok: false, error: "aborted" }, true);
        } else if (ended === "timeout") {
          record({ ...base, ok: false, error: "timeout" });
        } else if (this.status === 0) {
          record({ ...base, ok: false, error: "network error or CORS" });
        } else {
          const text = this.responseType === "" || this.responseType === "text" ? this.responseText : "";
          record({
            ...base,
            ok: false,
            status: this.status,
            error: `${this.status}${text ? ": " + text.slice(0, BODY_CHARS) : ""}`,
          });
        }
      });
    }
    return send.call(this, body);
  };
}

const ELEMENT_KINDS: Record<string, RequestRecord["kind"]> = {
  IMG: "img",
  VIDEO: "video",
  AUDIO: "audio",
  SOURCE: "video",
  SCRIPT: "script",
  LINK: "css",
};

// Element loads do not bubble, but the capture phase passes the window for elements in the
// document (a detached `new Image()` is not seen: FadeImage logs its own preload failures).
function watchElements(): void {
  function onEvent(e: Event): void {
    const el = e.target as (HTMLElement & { currentSrc?: string; src?: string; href?: string }) | null;
    const kind = el && ELEMENT_KINDS[el.tagName];
    if (!el || !kind) return;
    const url = absolute(el.currentSrc || el.src || el.href || "");
    if (!url || skip(url)) return;
    const timing = performance.getEntriesByName(url).pop();
    const ms = timing ? Math.round(timing.duration) : undefined;
    if (e.type === "error") record({ t: Date.now(), kind, url, ok: false, ms, error: "failed to load" });
    else record({ t: Date.now(), kind, url, ok: true, ms });
  }
  window.addEventListener("load", onEvent, true);
  // <video> and <audio> fire no load event.
  window.addEventListener("loadeddata", onEvent, true);
  window.addEventListener("error", onEvent, true);
}

let installed = false;

export function installNetworkLog(): void {
  if (installed) return;
  installed = true;
  wrapFetch();
  wrapXhr();
  watchElements();
}

installNetworkLog();
