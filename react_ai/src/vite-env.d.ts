/// <reference types="vite/client" />

declare const __APP_VERSION__: string;

interface Window {
  // Set by the inline crash reporter in main.html. Optional: the bundle must start without it.
  mvCrashReport?: {
    errors: string[];
    started: boolean;
    onError: ((text: string) => void) | null;
  };
}
