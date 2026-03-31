import { create } from "zustand";

import type { MframeComponent } from "@/types/harmony";

interface TemplateState {
  components: MframeComponent[];
  isStarted: boolean;
  isReady: boolean;
  duration: number;
  error: string | null;

  setComponents: (components: MframeComponent[]) => void;
  setStarted: (started: boolean) => void;
  setReady: (ready: boolean) => void;
  setDuration: (duration: number) => void;
  setError: (error: string) => void;

  getParam: <T = unknown>(componentName: string, paramName: string) => T | undefined;
}

export const useTemplateStore = create<TemplateState>((set, get) => ({
  components: [],
  isStarted: false,
  isReady: false,
  duration: -1,
  error: null,

  setComponents: (components) => set({ components }),
  setStarted: (started) => set({ isStarted: started }),
  setReady: (ready) => set({ isReady: ready }),
  setDuration: (duration) => set({ duration }),
  setError: (error) => set({ error }),

  getParam: <T = unknown>(componentName: string, paramName: string): T | undefined => {
    const { components } = get();
    const component = components.find((c) => c.name === componentName);
    if (!component) return undefined;
    const param = component.params.find((p) => p.name === paramName);
    return param?.value as T | undefined;
  },
}));
