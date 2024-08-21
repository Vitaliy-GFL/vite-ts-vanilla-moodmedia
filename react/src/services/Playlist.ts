import type PlaylistI from '@/types/PlaylistI';
import type { MusicStreamTracksCallbackFn, PlaylistCallbackFn, VotedTracksCallbackFn } from '@/types/PlaylistI';
import { createGlobalFn } from '@/utils';

class PlaylistService implements PlaylistI {
  getPlaylistContainerItems(playlistId: number, playlistItemsCallback: PlaylistCallbackFn) {
    window.Loader.getPlaylistContainerItems(playlistId, createGlobalFn('', playlistItemsCallback));
  }
  getMusicStreamTracks(playlistId: number, musicStreamTracksCallback: MusicStreamTracksCallbackFn) {
    window.Loader.getMusicStreamTracks(playlistId, createGlobalFn('', musicStreamTracksCallback));
  }
  voteMusicTrack(id: number) {
    window.Loader.voteMusicTrack(id);
  }
  getVotedTracks(votedTracksCallback: VotedTracksCallbackFn) {
    window.Loader.getVotedTracks(createGlobalFn('', votedTracksCallback));
  }
  async areMediaFilesAvailable(tracks: number[]) {
    return await window.Loader.areMediaFilesAvailable(tracks);
  }
}

export default new PlaylistService();