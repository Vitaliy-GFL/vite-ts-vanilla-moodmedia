import { getPlayerParameters } from "@visualsolutions/player-api/player-params";

// Reads player (site) parameters, e.g. getPlayerParams({ LOCATION_ID: "12068" }).
// A key the player does not have (null or empty) gets its default. So does every key when
// the player has not answered within timeoutMs: in the Harmony editor preview and on the
// dev server the request may never be answered.
export async function getPlayerParams<K extends string>(
  defaults: Record<K, string>,
  timeoutMs = 5000,
): Promise<Record<K, string>> {
  const keys = Object.keys(defaults) as K[];
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), timeoutMs);
  });

  let values: (string | null)[] | null = null;
  try {
    values = await Promise.race([getPlayerParameters(keys), timeout]);
    if (!values) console.warn(`getPlayerParams: no answer within ${timeoutMs} ms, using defaults`);
  } catch (err) {
    console.warn("getPlayerParams: failed, using defaults:", err);
  } finally {
    clearTimeout(timer);
  }

  const result = { ...defaults };
  keys.forEach((key, i) => {
    const value = values?.[i];
    if (value) result[key] = value;
  });
  return result;
}
