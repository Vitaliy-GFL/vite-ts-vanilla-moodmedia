const getLoader = () => window.Loader;

export type ChannelMessageCallback = (senderId: string, channelName: string, payload: string) => void;

let p2pCallbackCounter = 0;

export function joinChannel(clientId: string, channelName: string, callback: ChannelMessageCallback): void {
  const callbackName = `__p2pCb_${++p2pCallbackCounter}`;

  // Callback must be on global scope for Android player
  Object.defineProperty(window, callbackName, { value: callback, configurable: true });
  getLoader().joinChannel(clientId, channelName, (window as never)[callbackName]);
}

export function sendChannelMessage(clientId: string, channelName: string, payload: string): void {
  getLoader().sendChannelMessage(clientId, channelName, payload);
}

export function sendChannelMessageJson(clientId: string, channelName: string, data: unknown): void {
  getLoader().sendChannelMessage(clientId, channelName, JSON.stringify(data));
}
