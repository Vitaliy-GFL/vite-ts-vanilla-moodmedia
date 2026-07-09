import { create } from "zustand";

import type { MframeComponent } from "@/types/harmony";

const buildParamMap = (components: MframeComponent[]): Map<string, unknown> => {
  const map = new Map<string, unknown>();
  for (const component of components) {
    for (const param of component.params) {
      map.set(`${component.name}.${param.name}`, param.value);
    }
  }
  return map;
};

interface TemplateState {
  components: MframeComponent[];
  paramMap: Map<string, unknown>;
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
  paramMap: new Map(),
  isStarted: false,
  isReady: false,
  duration: -1,
  error: null,

  setComponents: (components) => set({ components, paramMap: buildParamMap(components) }),
  setStarted: (started) => set({ isStarted: started }),
  setReady: (ready) => set({ isReady: ready }),
  setDuration: (duration) => set({ duration }),
  setError: (error) => set({ error }),

  getParam: <T = unknown>(componentName: string, paramName: string): T | undefined =>
    get().paramMap.get(`${componentName}.${paramName}`) as T | undefined,
}));
