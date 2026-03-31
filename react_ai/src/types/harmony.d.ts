export interface MframeParam {
  name: string;
  type: string;
  value: unknown;
}

export interface MframeComponent {
  name: string;
  type: string | null;
  params: MframeParam[];
}

export type StartMode =
  | "AFTER_CURRENT_MEDIA_FINISH"
  | "IMMEDIATE_STOP_CURRENT_MEDIA"
  | "IMMEDIATE_PAUSE_CURRENT_MEDIA"
  | "OVERLAY_CURRENT_MEDIA"
  | "OVERLAY_AFTER_CURRENT_MEDIA_FINISH";

export type PlaybackActionType = "PLAY_NEXT";

export interface PlaylistItem {
  id: number;
  name: string;
  description: string;
  type: string;
  contentPlayerFileName: string;
  duration: number;
  schedule: {
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    validWeekDays: number;
  };
  mediaProperties: {
    naturalDuration: number | null;
    volume: number | null;
    width: number | null;
    height: number | null;
    keepAspectRatio: boolean | null;
    scaleType: "CENTER" | "FILL" | "FIT" | "STRETCH" | null;
    title: string | null;
    artistName: string | null;
    releaseTitle: string | null;
  };
}

export interface PlaylistItemSchedule {
  playlistItemId: number;
  playlistItemSchedule: {
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    validWeekDays: number;
    timeZone?: string;
  };
}

export interface PlaybackEvent {
  type: "MEDIA_START" | "MEDIA_PROGRESS" | "MEDIA_FINISHED" | "MEDIA_ERROR" | "NO_MEDIA";
  playbackStream: "VIDEO" | "MUSIC";
  mediaId: number;
  streamId: number;
  parentContainerId: number;
  mediaName: string;
  mediaType: string;
  isMusicTrack: boolean;
  isUserSelectedContent: boolean;
  renderingStartTime: number;
  duration: number;
  progress: number;
  params?: { message?: string };
}

export interface P2PMessage {
  senderId: string;
  channelName: string;
  payload: string;
}

export interface PlayerController {
  sendMessage(command: string, params?: unknown): Promise<unknown>;
  addEventListener(event: string, listener: (event: PlaybackEvent) => void): void;
  removeEventListener(event: string, listener: (event: PlaybackEvent) => void): void;
}

export interface HarmonyLoader {
  getComponents(): Promise<MframeComponent[]>;
  setComponents(components: MframeComponent[]): void;
  ready(): void;
  isStarted(): Promise<void>;
  finished(): void;
  error(message: string): void;
  getDuration(): number;
  getPlayerParameters(keys: string[]): Promise<(string | null)[]>;
  getNewAnalyticsSessionIdPromise(): Promise<string>;
  createAnalyticsEvent(
    userTriggered: boolean,
    sessionId: string | null,
    customParameters: Record<string, string>,
  ): void;

  // Playback API
  openMediaInZone(mediaId: string, zoneId: number, loop?: boolean, startMode?: StartMode): void;
  openMediaInCustomZone(mediaId: string, zoneName: string, loop?: boolean, startMode?: StartMode): void;
  stopPlaybackInZone(zoneId: number): void;
  stopPlaybackInCustomZone(zoneName: string): void;
  resumeLoopPlaybackInZone(zoneId: number): void;
  resumeLoopPlaybackInCustomZone(zoneName: string): void;
  clearPendingEventsInZone(zoneId: number): void;
  clearPendingEventsInCustomZone(zoneName: string): void;
  createCustomZone(
    zoneName: string,
    left: number,
    top: number,
    width: number,
    height: number,
    persistent: boolean,
    behind?: boolean,
    loopingPlaylistItemId?: string,
  ): void;
  deleteCustomZone(zoneName: string): void;

  // Playlist API
  getPlaylistContainerItems(playlistId: number, callback: (items: PlaylistItem[]) => void): void;
  setPlaylistItemsSchedules(schedules: PlaylistItemSchedule[]): void;
  areMediaFilesAvailable(mediaIds: number[]): Promise<boolean[]>;

  // P2P API
  joinChannel(
    clientId: string,
    channelName: string,
    callback: (senderId: string, channelName: string, payload: string) => void,
  ): void;
  sendChannelMessage(clientId: string, channelName: string, payload: string): void;

  // Playback listener
  addPlaybackListener(callback: (event: PlaybackEvent) => void): void;

  getCommunicator(): PlayerController;
  dataJson: unknown;
}

export interface HarmonyPlayer {
  openDevTools(): void;
}

export interface MvTemplate {
  setComponents: (components: MframeComponent[]) => void;
  render: () => void;
}

declare global {
  interface Window {
    Loader: HarmonyLoader;
    Player: HarmonyPlayer;
    mvTemplate: MvTemplate;
  }
}
