import { getPlaylistItems } from "@visualsolutions/player-api/playlist";
import { useEffect, useState } from "react";

import { DEV_MEDIA } from "@/config/devMedia";

// Maps each item of a Harmony playlist by its description (lowercased, trimmed) to the URL
// of its media file. Description, not name: Harmony appends a short hash to the name on upload.
// Empty until the playlist resolves. On the dev server, while the map is empty, DEV_MEDIA
// stands in for it.
export function usePlaylistMedia(playlistId: number | undefined): Record<string, string> {
  const [media, setMedia] = useState<Record<string, string>>({});

  useEffect(() => {
    setMedia((prev) => (Object.keys(prev).length > 0 ? {} : prev));
    if (!playlistId) return;

    let cancelled = false;
    getPlaylistItems(playlistId)
      .then((items) => {
        if (cancelled) return;
        const map: Record<string, string> = {};
        for (const item of items) {
          const key = item.description?.trim().toLowerCase();
          // Media files sit one directory up from the template.
          if (key && item.contentPlayerFileName) map[key] = `../${item.contentPlayerFileName}`;
        }
        setMedia(map);
      })
      .catch((err) => console.warn(`usePlaylistMedia: playlist ${playlistId} failed:`, err));

    return () => {
      cancelled = true;
    };
  }, [playlistId]);

  if (import.meta.env.DEV && Object.keys(media).length === 0) return DEV_MEDIA;
  return media;
}
