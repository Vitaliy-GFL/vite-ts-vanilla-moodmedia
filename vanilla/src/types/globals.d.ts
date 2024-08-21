import type { TemplateI } from './TemplateI';
import type P2PI from './P2P';
import type PlaybackI from './PlaybackI';
import type PlaylistI from './PlaylistI';
import type PlayerApplicationI from './PlayerAppI';
import type { AnalyticsI } from './AnalyticsI';
declare global {
  interface Window {
    Loader: TemplateI & P2PI & PlaybackI & PlaylistI & PlayerApplicationI & AnalyticsI;
  }
}
