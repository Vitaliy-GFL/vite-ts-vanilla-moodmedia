import type { MframeComponent } from "@visualsolutions/player-api/types";

const getLoader = () => window.Loader;

const MFRAME_TIMEOUT = 2000;

export async function initTemplate(): Promise<MframeComponent[]> {
  const loader = getLoader();
  const components = await Promise.race([
    loader.getComponents(),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Template configuration load timed out")), MFRAME_TIMEOUT),
    ),
  ]);
  return components;
}

export function signalReady(): void {
  getLoader().ready();
}

// Written by remote debug right before location.reload(), one per page (zones on the same origin
// reload on their own): mvRemoteReloadAt:<location.href> = <time>.
const RELOAD_STORAGE = `mvRemoteReloadAt:${location.href}`;
const RELOAD_WINDOW_MS = 60_000;

let started = false;
let failed = false;

// Whether the reloaded page should start itself: one the player had put on screen, or one that
// failed (its error is on screen). A page still waiting for its start must keep waiting.
export function startsAfterReload(): boolean {
  return started || failed;
}

// Leaves the marker for the reloaded page; false when localStorage did not keep it (off or full):
// then that page would wait for a play() that never comes. `probe` only checks and removes it.
export function markRemoteReload(probe = false): boolean {
  const value = String(Date.now());
  try {
    localStorage.setItem(RELOAD_STORAGE, value);
    const kept = localStorage.getItem(RELOAD_STORAGE) === value;
    if (probe) localStorage.removeItem(RELOAD_STORAGE);
    return kept;
  } catch {
    return false;
  }
}

// The player starts a template once, with Loader.play(), after its first ready(). A reload keeps
// the URL (autoPlay=false) but gets no second play(): it would wait for the start forever, on a
// black screen. Right after a remote reload the template starts itself.
function startsItself(): boolean {
  try {
    const marker = localStorage.getItem(RELOAD_STORAGE);
    if (marker === null) return false;
    localStorage.removeItem(RELOAD_STORAGE);
    // A time ahead of the clock (set back since) is not fresh either.
    const age = Date.now() - Number(marker);
    return age >= 0 && age < RELOAD_WINDOW_MS;
  } catch {
    return false;
  }
}

export async function waitForStart(): Promise<void> {
  const loader = getLoader();
  // `play` is in mtemplate-loader but not in the player-api typings.
  if (startsItself()) (loader as typeof loader & { play?: () => void }).play?.();
  await loader.isStarted();
  started = true;
}

export function signalFinished(): void {
  getLoader().finished();
}

export function signalError(message: string): void {
  failed = true;
  getLoader().error(message);
}

export function getDuration(): number {
  return getLoader().getDuration();
}
