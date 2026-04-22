const getLoader = () => window.Loader;

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
    void this.isServer;

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
    getLoader().joinChannel(this.clientId, this.channelName, (window as never)[callbackName]);

    this.emit("ping");
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
    getLoader().sendChannelMessage(this.clientId, this.channelName, JSON.stringify(envelope));
  }

  getPeers(): Peer[] {
    return Array.from(this.peers.values()).map((p) => ({ ...p }));
  }

  private dispatch(_senderId: string, _payload: string): void {
    // Filled in by the next task (dispatcher body: parse, echo filter, peer registry, auto-pong, fan-out).
  }
}
