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

// Set by remote debug right before location.reload() (keep the name in sync).
const RELOAD_STORAGE = "mvRemoteReloadAt";
const RELOAD_WINDOW_MS = 60_000;

// The player starts a template once, with Loader.play(), after its first ready(). A reload keeps
// the URL (autoPlay=false) but gets no second play(): it would wait for the start forever, on a
// black screen. Right after a remote reload the template starts itself.
function startsItself(): boolean {
  try {
    const at = Number(localStorage.getItem(RELOAD_STORAGE));
    localStorage.removeItem(RELOAD_STORAGE);
    return at > 0 && Date.now() - at < RELOAD_WINDOW_MS;
  } catch {
    return false;
  }
}

export function waitForStart(): Promise<void> {
  const loader = getLoader();
  // `play` is in mtemplate-loader but not in the player-api typings.
  if (startsItself()) (loader as typeof loader & { play?: () => void }).play?.();
  return loader.isStarted();
}

export function signalFinished(): void {
  getLoader().finished();
}

export function signalError(message: string): void {
  getLoader().error(message);
}

export function getDuration(): number {
  return getLoader().getDuration();
}
