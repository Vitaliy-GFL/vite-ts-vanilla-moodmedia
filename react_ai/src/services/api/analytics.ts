const getLoader = () => window.Loader;

export class AnalyticsClient {
  private sessionId: string = "";

  constructor() {
    this.startNewSession();
  }

   async startNewSession(): Promise<void> {
    this.sessionId = await getLoader().getNewAnalyticsSessionIdPromise();
  }

  async createEvent(userTriggered: boolean, customParameters: Record<string, string>): Promise<void> {
    getLoader().createAnalyticsEvent(userTriggered, this.sessionId, customParameters);
  }
}
