import PlayerApplicationI from '@/types/PlayerAppI';

class PlayerAppService implements PlayerApplicationI {
  openHomeApp() {
    window.Loader.openHomeApp();
  }

  openApp(applicationId: string) {
    window.Loader.openApp(applicationId);
  }

  openDiagnosticsApp() {
    window.Loader.openDiagnosticsApp();
  }

  openSettingsApp(params: Record<string, string>) {
    window.Loader.openSettingsApp(params);
  }

  closePlaybackApp() {
    window.Loader.closePlaybackApp();
  }
}

export default PlayerAppService;