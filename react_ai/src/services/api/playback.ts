import type { StartMode, PlaybackActionType } from "@/types/harmony";

const getLoader = () => window.Loader;

export function openMediaInZone(mediaId: string, zoneId: number, loop = false, startMode?: StartMode): void {
  getLoader().openMediaInZone(mediaId, zoneId, loop, startMode);
}

export function openMediaInCustomZone(mediaId: string, zoneName: string, loop = false, startMode?: StartMode): void {
  getLoader().openMediaInCustomZone(mediaId, zoneName, loop, startMode);
}

export function stopPlaybackInZone(zoneId: number): void {
  getLoader().stopPlaybackInZone(zoneId);
}

export function stopPlaybackInCustomZone(zoneName: string): void {
  getLoader().stopPlaybackInCustomZone(zoneName);
}

export function resumeLoopPlaybackInZone(zoneId: number): void {
  getLoader().resumeLoopPlaybackInZone(zoneId);
}

export function resumeLoopPlaybackInCustomZone(zoneName: string): void {
  getLoader().resumeLoopPlaybackInCustomZone(zoneName);
}

export function clearPendingEventsInZone(zoneId: number): void {
  getLoader().clearPendingEventsInZone(zoneId);
}

export function clearPendingEventsInCustomZone(zoneName: string): void {
  getLoader().clearPendingEventsInCustomZone(zoneName);
}

export function createCustomZone(
  zoneName: string,
  left: number,
  top: number,
  width: number,
  height: number,
  persistent: boolean,
  behind?: boolean,
  loopingPlaylistItemId?: string,
): void {
  getLoader().createCustomZone(zoneName, left, top, width, height, persistent, behind, loopingPlaylistItemId);
}

export function deleteCustomZone(zoneName: string): void {
  getLoader().deleteCustomZone(zoneName);
}

export function sendPlaybackActionCommand(streamId: number, type: PlaybackActionType): Promise<unknown> {
  const playerController = getLoader().getCommunicator();
  return playerController.sendMessage("PLAYBACK_ACTION_COMMAND", { streamId, type });
}
