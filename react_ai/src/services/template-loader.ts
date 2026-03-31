import type { MframeComponent } from "@/types/harmony";

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

export function waitForStart(): Promise<void> {
  return getLoader().isStarted();
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
