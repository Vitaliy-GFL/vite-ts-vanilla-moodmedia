export type MediaStartMode =
  | 'AFTER_CURRENT_MEDIA_FINISH'
  | 'IMMEDIATE_STOP_CURRENT_MEDIA'
  | 'IMMEDIATE_PAUSE_CURRENT_MEDIA'
  | 'OVERLAY_CURRENT_MEDIA';

export default interface PlaybackI {
  openMediaInZone: (mediaId: number, zoneId: number, loop?: boolean, startMode?: MediaStartMode) => void;
  openMediaInCustomZone: (mediaId: number, zoneName: string, loop: boolean, startMode?: MediaStartMode) => void;
  stopPlaybackInZone: (zoneId: number) => void;
  stopPlaybackInCustomZone: (zoneName: string) => void;
  resumeLoopPlaybackInZone: (zoneId: number) => void;
  resumeLoopPlaybackInCustomZone: (zoneName: string) => void;
  clearPendingEventsInZone: (zoneId: number) => void;
  clearPendingEventsInCustomZone: (zoneName: string) => void;
  createCustomZone: (
    zoneName: string,
    left: number,
    top: number,
    width: number,
    height: number,
    persistent?: boolean,
    behind?: boolean,
    loopingPlaylistItemId?: number | null
  ) => void;
  deleteCustomZone: (zoneName: string) => void;
}
