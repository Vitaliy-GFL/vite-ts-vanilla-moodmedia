const getLoader = () => window.Loader;

export function getPlayerParameters(keys: string[]): Promise<(string | null)[]> {
  return getLoader().getPlayerParameters(keys);
}
