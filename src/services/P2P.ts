import { createGlobalFn } from '@/utils';

type SubscribeFn = (message: string) => unknown;

class P2PService {
  private channel: string;
  private device: string;
  private subscribers: SubscribeFn[] = [];

  private messageListener = (_channel: string, _device: string, message: string) => {
    this.subscribers.forEach((fn) => fn(message));
  };

  constructor(channel: string, device: string, sendJoinMessage: boolean = false) {
    this.channel = channel;
    this.device = device;

    window.Loader.joinChannel(device, channel, createGlobalFn(this.channel + 'Receiver', this.messageListener));

    if (sendJoinMessage) {
      window.Loader.sendChannelMessage(device, channel, `${device} joined to "${channel}" channel!`);
    }
  }

  subscribe(callback: SubscribeFn) {
    if (this.subscribers.includes(callback)) return;

    this.subscribers.push(callback);
  }

  unsubscribe(callback: SubscribeFn) {
    const idx = this.subscribers.findIndex((fn) => callback === fn);

    this.subscribers.splice(idx, 1);
  }

  sendMessage(message: unknown) {
    window.Loader.sendChannelMessage(this.device, this.channel, JSON.stringify(message));
  }

  getChanne() {
    return this.channel;
  }

  geDevice() {
    return this.device;
  }
}

export default P2PService;
