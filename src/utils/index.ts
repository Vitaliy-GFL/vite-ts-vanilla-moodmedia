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
