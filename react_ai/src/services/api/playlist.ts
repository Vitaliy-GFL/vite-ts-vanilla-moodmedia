import type { PlaylistItem, PlaylistItemSchedule } from "@/types/harmony";

const getLoader = () => window.Loader;

export function getPlaylistItems(playlistId: number): Promise<PlaylistItem[]> {
  return new Promise((resolve) => {
    // Callback must be a named function on global scope for Android player.
    // Name is derived from fn.name so minification cannot desync it (keep_fnames preserves it).
    function playlistCallback(items: PlaylistItem[]) {
      delete (window as never)[playlistCallback.name];
      resolve(items);
    }

    Object.defineProperty(window, playlistCallback.name, {
      value: playlistCallback,
      configurable: true,
    });
    getLoader().getPlaylistContainerItems(playlistId, (window as never)[playlistCallback.name]);
  });
}

export function setPlaylistItemsSchedules(schedules: PlaylistItemSchedule[]): void {
  getLoader().setPlaylistItemsSchedules(schedules);
}

export function areMediaFilesAvailable(mediaIds: number[]): Promise<boolean[]> {
  return getLoader().areMediaFilesAvailable(mediaIds);
}
