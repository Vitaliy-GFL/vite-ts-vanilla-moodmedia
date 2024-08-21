export const WEEK_DAY_FLAG_SUNDAY = 1 << 0;
export const WEEK_DAY_FLAG_SATURDAY = 1 << 1;
export const WEEK_DAY_FLAG_FRIDAY = 1 << 2;
export const WEEK_DAY_FLAG_THURSDAY = 1 << 3;
export const WEEK_DAY_FLAG_WEDNESDAY = 1 << 4;
export const WEEK_DAY_FLAG_TUESDAY = 1 << 5;
export const WEEK_DAY_FLAG_MONDAY = 1 << 6;
export const WEEK_DAY_FLAG_NONE = 0;
export const WEEK_DAY_FLAG_ALL =
  WEEK_DAY_FLAG_SUNDAY |
  WEEK_DAY_FLAG_SATURDAY |
  WEEK_DAY_FLAG_FRIDAY |
  WEEK_DAY_FLAG_THURSDAY |
  WEEK_DAY_FLAG_WEDNESDAY |
  WEEK_DAY_FLAG_TUESDAY |
  WEEK_DAY_FLAG_MONDAY;
export const WEEK_DAY_FLAG_WEEKENDS = WEEK_DAY_FLAG_SUNDAY | WEEK_DAY_FLAG_SATURDAY;
export const WEEK_DAY_FLAG_WORKDAYS =
  WEEK_DAY_FLAG_FRIDAY | WEEK_DAY_FLAG_THURSDAY | WEEK_DAY_FLAG_WEDNESDAY | WEEK_DAY_FLAG_TUESDAY | WEEK_DAY_FLAG_MONDAY;

type PlaylistItem = {
  id: number;
  name: string;
  description: string;
  type: 'Audio' | 'Image' | 'Video' | 'HtmlTemplate' | 'Playlist' | 'Tag';
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
    scaleType: 'CENTER' | 'FILL' | 'FIT' | 'STRETCH' | null;
    title: string | null;
    artistName: string | null;
    releaseTitle: string | null;
  };
};

type TrackItem = Omit<PlaylistItem, 'type' | 'schedule' | 'contentPlayerFileName'>;

export type PlaylistCallbackFn = (items: null | PlaylistItem[]) => void;
export type MusicStreamTracksCallbackFn = (items: null | TrackItem[]) => void;
export type VotedTracksCallbackFn = (items: null | TrackItem[]) => void;

export default interface PlaylistI {
  getPlaylistContainerItems: (playlistId: number, playlistItemsCallback: PlaylistCallbackFn) => void;
  getMusicStreamTracks: (playlistId: number, musicStreamTracksCallback: MusicStreamTracksCallbackFn) => void;
  voteMusicTrack: (id: number) => void;
  getVotedTracks: (votedTracksCallback: VotedTracksCallbackFn) => void;
  areMediaFilesAvailable: (tracks: number[]) => Promise<boolean[]>;
}