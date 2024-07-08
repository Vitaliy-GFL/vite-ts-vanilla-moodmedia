/* eslint-disable @typescript-eslint/ban-ts-comment */

export const createGlobalFn = <T>(name: string, fn: T): T => {
  // @ts-expect-error
  window[name] = fn;

  // @ts-expect-error
  Object.defineProperty(window[name], 'name', {
    value: name,
  });

  // @ts-expect-error
  return window[name];
};

type Param = {
  name: string;
  value: unknown;
};

type Component = {
  name: string;
  params: Array<Param>;
};

export const getMFparam = <T>(components: Array<Component>, name: string, param: string): T | null => {
  const result = components.filter((c) => c.name === name)[0]?.params.filter((p) => p.name === param)[0];
  return result ? (result.value as T) : null;
};

export function getElement<T>(selector: string, context: HTMLElement | Document = document) {
  const element = context.querySelector(selector);
  return element as T || null;
}
