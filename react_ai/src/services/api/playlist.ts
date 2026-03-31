import type { PlaylistItem, PlaylistItemSchedule } from "@/types/harmony";

const getLoader = () => window.Loader;

let playlistCallbackCounter = 0;

export function getPlaylistItems(playlistId: number): Promise<PlaylistItem[]> {
  return new Promise((resolve) => {
    const callbackName = `__playlistCb_${++playlistCallbackCounter}`;

    const callback = (items: PlaylistItem[]) => {
      delete (window as never)[callbackName];
      resolve(items);
    };

    // Callback must be on global scope for Android player
    Object.defineProperty(window, callbackName, { value: callback, configurable: true });
    getLoader().getPlaylistContainerItems(playlistId, (window as never)[callbackName]);
  });
}

export function setPlaylistItemsSchedules(schedules: PlaylistItemSchedule[]): void {
  getLoader().setPlaylistItemsSchedules(schedules);
}

export function areMediaFilesAvailable(mediaIds: number[]): Promise<boolean[]> {
  return getLoader().areMediaFilesAvailable(mediaIds);
}
