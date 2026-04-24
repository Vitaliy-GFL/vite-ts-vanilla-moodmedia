const getLoader = () => window.Loader;

export class AnalyticsClient {
  private sessionId: string = "";
  private newSessionPromise: Promise<void> | null = null;

  constructor() {
    this.newSessionPromise = this.startNewSession();
  }

  async startNewSession(): Promise<void> {
    this.sessionId = await getLoader().getNewAnalyticsSessionIdPromise();
  }

  async createEvent(userTriggered: boolean, customParameters: Record<string, string>): Promise<void> {
    await this.newSessionPromise;
    getLoader().createAnalyticsEvent(userTriggered, this.sessionId, customParameters);
  }

  getSessionId(): string {
    return this.sessionId;
  }
}
