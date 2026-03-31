const getLoader = () => window.Loader;

export function getSessionId(): Promise<string> {
  return getLoader().getNewAnalyticsSessionIdPromise();
}

export function createAnalyticsEvent(
  userTriggered: boolean,
  sessionId: string | null,
  customParameters: Record<string, string>,
): void {
  getLoader().createAnalyticsEvent(userTriggered, sessionId, customParameters);
}
