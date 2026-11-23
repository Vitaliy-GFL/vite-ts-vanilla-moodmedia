import { getPlayerParameters } from "@visualsolutions/player-api/player-params";

import { getCapturedEntries, subscribeEntries, type LogEntry } from "@/hooks/useConsoleCapture";
import { collectState, runCommand, utf8Length, type Command, type CommandResult } from "@/services/remote-collectors";

// Remote debug: while the device parameter REMOTE_DEBUG is non-empty, the template sends its
// console output to template-logs-api every 10 s, filed under that value (the key; devices give
// templates no serial number), and runs the commands the page asked for, which come back in the
// answer. Switched on and off from Harmony; the parameter is re-read every minute.
// See docs/player-api.md, "Remote debug".

const PARAM = "REMOTE_DEBUG";
const POLL_MS = 60_000;
const SEND_MS = 10_000;
const PARAM_TIMEOUT_MS = 5_000;
const SEND_TIMEOUT_MS = 15_000;
// The service takes ≤ 200 entries, ≤ 4096 chars each, a state and each result ≤ 64 KB, ≤ 256 KB
// a body, in bytes: the body is measured as UTF-8 before it goes (BODY_BYTES leaves room).
const BUFFER_MAX = 200;
const MSG_MAX = 4_096;
const BODY_BYTES = 240_000;
// Also read by the crash path in main.html: keep the names in sync.
const KEY_STORAGE = "mvRemoteDebugKey";
const BUFFER_STORAGE = "mvRemoteDebugBuffer";
// Read by waitForStart() in template-loader.ts.
const RELOAD_STORAGE = "mvRemoteReloadAt";

interface Buffered {
  session: string;
  version: string;
  t: number;
  level: LogEntry["level"];
  msg: string;
}

const session = Math.random().toString(36).slice(2, 10);

// The remembered key keeps the console capture on from the start, before the first answer:
// otherwise everything logged until then would be lost.
let key = readStorage(KEY_STORAGE) ?? "";
let answered = false;
let started = false;
let buffer: Buffered[] = loadBuffer();
let results: CommandResult[] = [];
let stateSent = false;
// The id of an answered `reload`: the page reloads once that result is delivered.
let reloadId: string | null = null;
// Commands waiting to run, one at a time; ids already queued, run or answered are not run again
// when the service hands a command out a second time.
const queue: Command[] = [];
const seen = new Set<string>();
let running = false;
// Bumped on switch-off: a command that finishes after it is dropped.
let generation = 0;
let sendTimer: ReturnType<typeof setInterval> | undefined;
let saveTimer: ReturnType<typeof setTimeout> | undefined;
let unsubscribe: (() => void) | undefined;
let sending = false;
// The id of the last captured entry put in the buffer, so a switch-on never takes one twice.
let takenId = 0;
let onToggle: () => void = () => {};

function readStorage(name: string): string | null {
  try {
    return localStorage.getItem(name);
  } catch {
    return null;
  }
}

function writeStorage(name: string, value: string | null): void {
  try {
    if (value === null) localStorage.removeItem(name);
    else localStorage.setItem(name, value);
  } catch {
    // Storage off or full: the buffer still works in memory for this page load.
  }
}

function loadBuffer(): Buffered[] {
  try {
    const parsed: unknown = JSON.parse(readStorage(BUFFER_STORAGE) ?? "[]");
    return Array.isArray(parsed) ? (parsed as Buffered[]) : [];
  } catch {
    return [];
  }
}

// Saved a second after the last change, not on every entry: a chatty template would
// otherwise serialise the whole buffer on each console.log.
function saveSoon(): void {
  if (saveTimer !== undefined) return;
  saveTimer = setTimeout(() => {
    saveTimer = undefined;
    writeStorage(BUFFER_STORAGE, buffer.length > 0 ? JSON.stringify(buffer) : null);
  }, 1_000);
}

function add(entry: LogEntry): void {
  takenId = entry.id;
  buffer.push({
    session,
    version: __APP_VERSION__,
    t: entry.timestamp,
    level: entry.level,
    msg: entry.args.slice(0, MSG_MAX),
  });
  if (buffer.length > BUFFER_MAX) buffer.splice(0, buffer.length - BUFFER_MAX);
  saveSoon();
}

// True while the console capture must stay installed for remote debug.
export function isRemoteDebugOn(): boolean {
  return key !== "";
}

// The status and, on success, the commands in the answer; status 0 for a network error.
async function post(body: unknown): Promise<{ status: number; commands: Command[] }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SEND_TIMEOUT_MS);
  try {
    // text/plain: a simple request, no CORS preflight.
    const res = await fetch(`${import.meta.env.VITE_LOGS_BASE}/api/logs`, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const answer = res.ok ? ((await res.json().catch(() => ({}))) as { commands?: Command[] }) : {};
    return { status: res.status, commands: Array.isArray(answer.commands) ? answer.commands : [] };
  } catch {
    return { status: 0, commands: [] };
  } finally {
    clearTimeout(timer);
  }
}

// Runs queued commands one after another (the FPS count must not compete with another
// collector), then sends their results without waiting for the tick.
async function runQueue(): Promise<void> {
  if (running) return;
  running = true;
  const gen = generation;
  while (queue.length > 0) {
    const command = queue.shift()!;
    // oxlint-disable-next-line no-await-in-loop
    const result = await runCommand(command);
    if (gen !== generation) break;
    results.push(result);
    if (command.type === "reload" && result.ok) reloadId = command.id;
  }
  running = false;
  if (gen === generation) void send();
}

function enqueue(commands: Command[]): void {
  for (const command of commands) {
    if (seen.has(command.id)) continue;
    seen.add(command.id);
    queue.push(command);
  }
  void runQueue();
}

type Body = {
  key: string;
  session: string;
  template: string;
  version: string;
  entries: { t: number; level: Buffered["level"]; msg: string }[];
  state?: Record<string, unknown>;
  results?: CommandResult[];
};

// Entries go by session, the oldest first (left from before a restart). The body is cut to
// BODY_BYTES of UTF-8: entries from the end first, then results beyond the first.
function buildBody(): { body: Body; items: Buffered[]; sentResults: CommandResult[]; withState: boolean } {
  const first = buffer[0];
  const batchSession = first?.session ?? session;
  const items: Buffered[] = [];
  for (const item of buffer) {
    if (item.session !== batchSession || items.length >= BUFFER_MAX) break;
    items.push(item);
  }
  const sentResults = results.slice(0, 10);
  // The state once per session, unasked; the page can ask for a fresh one.
  const withState = !stateSent && batchSession === session;

  const make = (): Body => ({
    key,
    session: batchSession,
    template: document.title,
    version: first?.version ?? __APP_VERSION__,
    entries: items.map(({ t, level, msg }) => ({ t, level, msg })),
    ...(withState ? { state: collectState() } : {}),
    ...(sentResults.length > 0 ? { results: sentResults } : {}),
  });
  let body = make();
  while (utf8Length(JSON.stringify(body)) > BODY_BYTES && (items.length > 1 || sentResults.length > 1)) {
    if (items.length > 1) items.length = Math.ceil(items.length / 2);
    else sentResults.length = 1;
    body = make();
  }
  return { body, items, sentResults, withState };
}

// One POST per tick, also with nothing in it: the answer is how commands reach the template.
// Failures are not logged: that would be captured and sent.
async function send(): Promise<void> {
  if (sending || !answered || key === "") return;
  sending = true;
  try {
    const { body, items, sentResults, withState } = buildBody();
    const { status, commands } = await post(body);

    const ok = status >= 200 && status < 300;
    // Another 4xx (400, 413) would fail the same way forever: drop the batch. Keep it on a
    // network error, a 5xx, 408 or 429 for the next tick.
    const rejected = status >= 400 && status < 500 && status !== 408 && status !== 429;
    if (ok || rejected) {
      buffer = buffer.filter((item) => !items.includes(item));
      results = results.filter((r) => !sentResults.includes(r));
      saveSoon();
    }
    if (ok && withState) stateSent = true;
    if (ok && reloadId !== null && sentResults.some((r) => r.id === reloadId)) {
      // Written now, not in a second: the reload would lose what is still unsaved.
      writeStorage(BUFFER_STORAGE, buffer.length > 0 ? JSON.stringify(buffer) : null);
      // The player will not start the reloaded page: template-loader.ts starts it itself.
      writeStorage(RELOAD_STORAGE, String(Date.now()));
      location.reload();
      return;
    }
    if (commands.length > 0) enqueue(commands);
  } finally {
    sending = false;
  }
}

function switchOn(): void {
  if (unsubscribe) return;
  // The entries captured before the switch (bootstrap, errors from before the bundle ran)
  // go first, unless an earlier switch-on of this page load already took them.
  for (const entry of getCapturedEntries()) if (entry.id > takenId) add(entry);
  unsubscribe = subscribeEntries(add);
  sendTimer = setInterval(() => void send(), SEND_MS);
}

function switchOff(): void {
  unsubscribe?.();
  unsubscribe = undefined;
  clearInterval(sendTimer);
  buffer = [];
  results = [];
  queue.length = 0;
  reloadId = null;
  generation++;
  stateSent = false;
  writeStorage(BUFFER_STORAGE, null);
}

// Resolves to the trimmed value, or null when the player did not answer (editor preview,
// dev server): then nothing changes. Not getPlayerParams: it warns on every timeout.
async function readParam(): Promise<string | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), PARAM_TIMEOUT_MS);
  });
  try {
    const values = await Promise.race([getPlayerParameters([PARAM]), timeout]);
    return values ? (values[0] ?? "").trim() : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function poll(): Promise<void> {
  const value = await readParam();
  if (value !== null) {
    answered = true;
    if (value !== key) {
      const wasOn = key !== "";
      key = value;
      writeStorage(KEY_STORAGE, value || null);
      if (!value) switchOff();
      // Before the log line: the capture may only now be installed.
      onToggle();
      if (value && !wasOn) console.log(`Remote debug on: ${value}`);
    }
    if (key) {
      switchOn();
      void send();
    }
  }
  setTimeout(() => void poll(), POLL_MS);
}

// Starts polling REMOTE_DEBUG; call once, as early as the Loader is there. toggle runs when
// the parameter turns on or off, so the caller can install or remove the console capture.
export function startRemoteDebug(toggle: () => void): void {
  if (started) return;
  started = true;
  onToggle = toggle;
  if (!import.meta.env.VITE_LOGS_BASE) {
    console.error("Remote debug: VITE_LOGS_BASE is not set for this build");
    return;
  }
  void poll();
}
