export default interface PlayerApplicationI {
  openHomeApp: () => void;
  closePlaybackApp: () => void;
  openApp: (applicationId: string | 'com.android.settings') => void;
  openDiagnosticsApp: () => void;
  openSettingsApp: (params: Record<string, string>) => void;
}