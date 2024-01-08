export type channelMessageReceiverFn = (senderId: string, channelName: string, payload: string) => void;

export default interface P2PI {
	joinChannel: (clientId: string | null, channelName: string, channelMessageReceiver: channelMessageReceiverFn) => void;
	sendChannelMessage: (clientId: string | null, channelName: string, message: string) => void;
}
