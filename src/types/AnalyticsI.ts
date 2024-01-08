export interface AnalyticsI {
	getNewAnalyticsSessionIdPromise: () => Promise<string>;
	createAnalyticsEvent: (userTriggered: boolean, sessionId: string, customParameters: Record<string, string>) => void;
}
