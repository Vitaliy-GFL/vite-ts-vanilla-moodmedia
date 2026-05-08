let p2pCallbackCounter = 0;

export type Envelope = { type: string; clientId: string; data?: unknown };
export type MessageHandler = (data: unknown, fromClientId: string) => void;
export type Peer = { clientId: string; online: boolean; lastSeen: number };

export class P2PClient {
  private readonly channelName: string;
  private readonly clientId: string;
  private readonly isServer: boolean;
  private readonly handlers = new Map<string, MessageHandler[]>();
  private readonly peers = new Map<string, Peer>();

  constructor(channelName: string, clientId: string, isServer: boolean = false) {
    this.channelName = channelName;
    this.clientId = clientId;
    this.isServer = isServer;

    const callbackName = `__p2pCb_${++p2pCallbackCounter}`;
    // Computed property name sets callback.name === callbackName.
    // Required by the Android player which looks up the callback by function name.
    const named = {
      [callbackName]: (senderId: string, _channel: string, payload: string): void => {
        this.dispatch(senderId, payload);
      },
    };
    const callback = named[callbackName];
    Object.defineProperty(window, callbackName, { value: callback, configurable: true });
    window.Loader.joinChannel(this.clientId, this.channelName, (window as never)[callbackName]);

    this.emit("ping");

    if (this.isServer) {
      const initialPingTime = Date.now();
      setTimeout(() => this.evaluate(initialPingTime), 3_000);
      setInterval(() => this.tick(), 60_000);
    }
  }

  on(type: string, handler: MessageHandler): void {
    const list = this.handlers.get(type);
    if (list) {
      list.push(handler);
    } else {
      this.handlers.set(type, [handler]);
    }
  }

  emit(type: string, data?: unknown): void {
    const envelope: Envelope = { type, clientId: this.clientId, data };
    window.Loader.sendChannelMessage(this.clientId, this.channelName, JSON.stringify(envelope));
  }

  getPeers(): Peer[] {
    return Array.from(this.peers.values()).map((p) => ({ ...p }));
  }

  private tick(): void {
    const pingTime = Date.now();
    this.emit("ping");
    setTimeout(() => this.evaluate(pingTime), 3_000);
  }

  private evaluate(pingTime: number): void {
    for (const peer of this.peers.values()) {
      peer.online = peer.lastSeen >= pingTime;
    }
  }

  private dispatch(_senderId: string, payload: string): void {
    let envelope: Envelope;
    try {
      const parsed = JSON.parse(payload) as unknown;
      if (
        !parsed ||
        typeof parsed !== "object" ||
        typeof (parsed as Envelope).type !== "string" ||
        typeof (parsed as Envelope).clientId !== "string"
      ) {
        console.warn("P2PClient: malformed message", payload);
        return;
      }
      envelope = parsed as Envelope;
    } catch {
      console.warn("P2PClient: malformed message", payload);
      return;
    }

    if (this.isServer) {
      const existing = this.peers.get(envelope.clientId);
      if (existing) {
        existing.online = true;
        existing.lastSeen = Date.now();
      } else {
        this.peers.set(envelope.clientId, {
          clientId: envelope.clientId,
          online: true,
          lastSeen: Date.now(),
        });
      }
    }

    if (envelope.type === "ping") {
      this.emit("pong");
    }

    const list = this.handlers.get(envelope.type);
    if (!list) return;
    for (const handler of list) {
      try {
        handler(envelope.data, envelope.clientId);
      } catch (err) {
        console.error("P2PClient: handler threw", err);
      }
    }
  }
}
