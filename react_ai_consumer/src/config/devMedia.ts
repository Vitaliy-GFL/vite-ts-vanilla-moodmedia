// Dev server only: stands in for the playlists in usePlaylistMedia(), since the dev server
// has none. Put the files in /dev-media at the project root (not in public/): the dev
// server serves them, the build never copies them.
// Keys are lowercased descriptions, as in the Harmony playlist. Values stay plain string
// literals, so the bundler drops the whole map from a build.
// Example: "classic burger": "/dev-media/classic-burger.webp",
export const DEV_MEDIA: Record<string, string> = {};
