import { getPlayerParameters } from "@visualsolutions/player-api/player-params";
import { areMediaFilesAvailable, getPlaylistItems } from "@visualsolutions/player-api/playlist";

import { getCapturedEntries } from "@/hooks/useConsoleCapture";
import { getRequests } from "@/services/network-log";
import { useTemplateStore } from "@/store/templateStore";
import { BROWSER } from "@/utils/browser";

// What remote debug can be asked for from the template-logs page. A fixed list: a command only
// names one of these, nothing is ever evaluated. Each result stays under RESULT_BYTES of UTF-8 (the
// service takes ≤ 64 KB).

// Bytes of UTF-8: the service limit is in bytes, and menus are often not ASCII.
export const RESULT_BYTES = 60_000;
const PLAYER_TIMEOUT_MS = 10_000;
const MAX_DOM_ELEMENTS = 300;
const TEXT_CHARS = 80;
const FPS_MS = 5_000;

const startedAt = Date.now();

// Resolves to undefined when the player does not answer in time (editor preview, dev server).
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | undefined> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<undefined>((resolve) => {
    timer = setTimeout(() => resolve(undefined), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

export function utf8Length(text: string): number {
  return new Blob([text]).size;
}

const fits = (value: unknown) => utf8Length(JSON.stringify(value)) <= RESULT_BYTES;
const MAX_ERROR = 4_000;

export function collectState(): Record<string, unknown> {
  const components: Record<string, Record<string, unknown>> = {};
  for (const c of useTemplateStore.getState().components) {
    components[c.name] = Object.fromEntries(c.params.map((p) => [p.name, p.value]));
  }
  const state: Record<string, unknown> = {
    version: __APP_VERSION__,
    browser: BROWSER,
    userAgent: navigator.userAgent,
    screen: `${screen.width}x${screen.height}`,
    window: `${window.innerWidth}x${window.innerHeight}`,
    dpr: window.devicePixelRatio,
    href: location.href,
    uptimeS: Math.round((Date.now() - startedAt) / 1000),
    components,
  };
  // Long rich-text params are the likely cause.
  if (!fits(state)) state.components = "too big to send";
  return state;
}

interface PlaylistResult {
  playlistId: number;
  items?: { description: string; file: string; available?: boolean; [field: string]: unknown }[];
  error?: string;
}

// One playlist with what matters to a template per item: the description it is matched by, the
// file and whether it is on the device. `available` is asked by the item id: check on a device.
async function playlist(playlistId: number): Promise<PlaylistResult> {
  try {
    const items = await withTimeout(getPlaylistItems(playlistId), PLAYER_TIMEOUT_MS);
    if (!items) return { playlistId, error: "no answer from the player" };
    const available = await withTimeout(areMediaFilesAvailable(items.map((i) => i.id)), PLAYER_TIMEOUT_MS).catch(
      () => undefined,
    );
    return {
      playlistId,
      items: items.map((item, i) => ({
        id: item.id,
        description: item.description,
        name: item.name,
        type: item.type,
        file: item.contentPlayerFileName,
        duration: item.duration,
        schedule: item.schedule,
        available: available?.[i],
      })),
    };
  } catch (err) {
    return { playlistId, error: String(err) };
  }
}

// Every playlist the mediaReference params point to, by param.
async function collectPlaylists(): Promise<Record<string, unknown>> {
  const params = useTemplateStore
    .getState()
    .components.flatMap((c) =>
      c.params
        .filter((p) => p.type === "mediaReference" && Array.isArray(p.value))
        .map((p) => ({ name: `${c.name}.${p.name}`, ids: p.value as number[] })),
    );
  const lists = await Promise.all(params.map((p) => Promise.all(p.ids.map(playlist))));
  const result: Record<string, PlaylistResult[] | string> = Object.fromEntries(
    params.map((p, i) => [p.name, lists[i] ?? []]),
  );
  if (params.length === 0) return { note: "no mediaReference params in mframe" };
  if (fits(result)) return result;

  // Too big: keep the three fields a template mostly needs.
  for (const [name, value] of Object.entries(result)) {
    if (typeof value === "string") continue;
    result[name] = value.map((list) => ({
      ...list,
      items: list.items?.map(({ description, file, available }) => ({ description, file, available })),
    }));
  }
  return fits(result) ? result : { error: "too big to send even shortened" };
}

async function collectParams(keys: string[]): Promise<Record<string, string | null>> {
  const values = await withTimeout(getPlayerParameters(keys), PLAYER_TIMEOUT_MS);
  if (!values) throw new Error("no answer from the player");
  return Object.fromEntries(keys.map((key, i) => [key, values[i] ?? null]));
}

function ownText(el: Element): string {
  let text = "";
  for (const node of Array.from(el.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) text += node.textContent ?? "";
  }
  return text.replace(/\s+/g, " ").trim().slice(0, TEXT_CHARS);
}

// The layout as the player renders it: why the screenshot looks the way it does. Elements with
// their own text, media, and the top three levels of the app; the debug console is left out.
function collectDom(): Record<string, unknown> {
  const root = document.getElementById("root") ?? document.body;
  const elements: Record<string, unknown>[] = [];
  const all = root.querySelectorAll("*");

  for (const el of Array.from(all)) {
    if (elements.length >= MAX_DOM_ELEMENTS) break;
    if (el.closest(".debug-modal")) continue;
    const tag = el.tagName.toLowerCase();
    const media = tag === "img" || tag === "video" || tag === "canvas" || tag === "iframe";
    const text = ownText(el);
    let depth = 0;
    for (let p = el.parentElement; p && p !== root; p = p.parentElement) depth++;
    if (!media && !text && depth > 2) continue;

    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const entry: Record<string, unknown> = {
      tag,
      box: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)],
    };
    if (el.id) entry.id = el.id;
    const cls = typeof el.className === "string" ? el.className.trim().split(/\s+/).slice(0, 2).join(" ") : "";
    if (cls) entry.class = cls;
    if (text) entry.text = text;
    if (cs.display === "none" || cs.visibility === "hidden" || Number(cs.opacity) === 0) entry.hidden = true;
    if (el instanceof HTMLImageElement) {
      Object.assign(entry, { src: el.currentSrc || el.src, loaded: el.complete && el.naturalWidth > 0 });
      if (el.naturalWidth) entry.natural = `${el.naturalWidth}x${el.naturalHeight}`;
    }
    if (el instanceof HTMLVideoElement) {
      Object.assign(entry, {
        src: el.currentSrc || el.src,
        readyState: el.readyState,
        paused: el.paused,
        currentTime: Math.round(el.currentTime),
        error: el.error?.code,
      });
    }
    elements.push(entry);
  }

  const result = {
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    dpr: window.devicePixelRatio,
    totalElements: all.length,
    elements,
  };
  while (!fits(result) && result.elements.length > 0) result.elements.length = Math.floor(result.elements.length / 2);
  return result;
}

// Frames per second over FPS_MS, counted with requestAnimationFrame.
function measureFps(): Promise<number> {
  return new Promise((resolve) => {
    let frames = 0;
    const start = performance.now();
    function tick(now: number) {
      frames++;
      if (now - start < FPS_MS) requestAnimationFrame(tick);
      else resolve(Math.round((frames * 1000) / (now - start)));
    }
    requestAnimationFrame(tick);
  });
}

const mb = (bytes: number | undefined) => (bytes === undefined ? undefined : Math.round(bytes / 1_048_576));

async function collectPerf(): Promise<Record<string, unknown>> {
  // No frames while the page is hidden or throttled (editor preview, a hidden zone): never hang.
  const fps = await withTimeout(measureFps(), FPS_MS + 2_000);
  // Chrome only, and only rounded values without special flags; still shows a leak over hours.
  const memory = (performance as Performance & { memory?: Record<string, number> }).memory;
  return {
    uptimeS: Math.round((Date.now() - startedAt) / 1000),
    fps: fps ?? "no frames (page hidden?)",
    memoryMB: memory
      ? { used: mb(memory.usedJSHeapSize), total: mb(memory.totalJSHeapSize), limit: mb(memory.jsHeapSizeLimit) }
      : "not available",
    domNodes: document.getElementsByTagName("*").length,
    capturedLogs: getCapturedEntries().length,
    failedRequests: getRequests().filter((r) => !r.ok).length,
  };
}

export interface Command {
  id: string;
  type: string;
  args?: { keys?: string[] };
}

export interface CommandResult {
  id: string;
  ok: boolean;
  data?: unknown;
  error?: string;
}

// Runs one command; never throws. `reload` only answers: the caller reloads once it is sent.
export async function runCommand(command: Command): Promise<CommandResult> {
  try {
    let data: unknown;
    switch (command.type) {
      case "state":
        data = collectState();
        break;
      case "playlists":
        data = await collectPlaylists();
        break;
      case "params":
        data = await collectParams(command.args?.keys ?? []);
        break;
      case "requests": {
        // Many failures with bodies can outgrow a result: the oldest go first.
        let list = getRequests();
        while (!fits(list) && list.length > 0) list = list.slice(Math.ceil(list.length / 4));
        data = list;
        break;
      }
      case "dom":
        data = collectDom();
        break;
      case "perf":
        data = await collectPerf();
        break;
      case "reload":
        data = "reloading";
        break;
      default:
        return { id: command.id, ok: false, error: `unknown command ${command.type}: update the template` };
    }
    if (!fits(data)) return { id: command.id, ok: false, error: "result too big" };
    return { id: command.id, ok: true, data };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { id: command.id, ok: false, error: message.slice(0, MAX_ERROR) };
  }
}
