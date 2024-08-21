type LogItem = {
  userTriggered: boolean;
  params: Record<string, string>;
};

class AnalyticsService {
  private sessionId: string = '';
  private logs: LogItem[] = [];

  constructor() {
    window.Loader.getNewAnalyticsSessionIdPromise()
      .then((id: string) => {
        this.sessionId = id;
      })
      .catch(() => {
        this.sessionId = new Date().getTime().toString(16);
      });
  }

  createEvent(userTriggered: boolean, customParameters: Record<string, string>) {
    this.logs.push({
      userTriggered,
      params: customParameters,
    });

    window.Loader.createAnalyticsEvent(userTriggered, this.sessionId, customParameters);
  }

  getId() {
    return this.sessionId;
  }

  getLogs() {
    return this.logs;
  }
}

export default new AnalyticsService();