import type PlaylistI from '@/types/PlaylistI';
import type { MusicStreamTracksCallbackFn, PlaylistCallbackFn, VotedTracksCallbackFn } from '@/types/PlaylistI';
import { createGlobalFn } from '@/utils';

const genHex = () => Math.ceil(Math.random() * Math.pow(10, 6)).toString(16);

class PlaylistService implements PlaylistI {
  getPlaylistContainerItems(playlistId: number, playlistItemsCallback: PlaylistCallbackFn) {
    window.Loader.getPlaylistContainerItems(playlistId, createGlobalFn('playlistItemsCallback' + genHex(), playlistItemsCallback));
  }
  getMusicStreamTracks(playlistId: number, musicStreamTracksCallback: MusicStreamTracksCallbackFn) {
    window.Loader.getMusicStreamTracks(playlistId, createGlobalFn('musicStreamTracksCallback' + genHex(), musicStreamTracksCallback));
  }
  voteMusicTrack(id: number) {
    window.Loader.voteMusicTrack(id);
  }
  getVotedTracks(votedTracksCallback: VotedTracksCallbackFn) {
    window.Loader.getVotedTracks(createGlobalFn('votedTracksCallback' + genHex(), votedTracksCallback));
  }
  async areMediaFilesAvailable(tracks: number[]) {
    return await window.Loader.areMediaFilesAvailable(tracks);
  }
}

export default new PlaylistService();