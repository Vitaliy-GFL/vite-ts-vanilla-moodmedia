import { useEffect, useRef, useState, type CSSProperties } from "react";

import "./FadeImage.scss";

interface FadeImageProps {
  src: string;
  alt?: string;
  className?: string;
  style?: CSSProperties;
  // Fade duration. Default: 500 ms.
  durationMs?: number;
}

// An image that changes without a blank frame: a new src is loaded off screen first and then
// fades in over the old one. If it fails to load, the old image stays.
// Size goes on the wrapper (className/style); both images fill it with object-fit: cover,
// override `.fade-image__img` for another fit.
export default function FadeImage({ src, alt = "", className, style, durationMs = 500 }: FadeImageProps) {
  // Each layer has its own key, so React keeps the old <img> in place while the new one fades in.
  const [layers, setLayers] = useState<{ key: number; src: string }[]>([]);
  const nextKey = useRef(0);

  useEffect(() => {
    // No image to show (e.g. no match in the playlist): clear, don't keep the previous one.
    if (!src) {
      setLayers((prev) => (prev.length > 0 ? [] : prev));
      return;
    }
    const img = new Image();
    const onLoad = () =>
      setLayers((prev) => {
        if (prev[prev.length - 1]?.src === src) return prev;
        const layer = { key: nextKey.current++, src };
        // Mid-fade: replace the half-faded top layer and keep the opaque one under it,
        // so the background never shows through.
        return [...prev.slice(0, 1), layer];
      });
    const onError = () => console.warn(`FadeImage: failed to load ${src}`);
    img.addEventListener("load", onLoad);
    img.addEventListener("error", onError);
    img.src = src;
    return () => {
      img.removeEventListener("load", onLoad);
      img.removeEventListener("error", onError);
    };
  }, [src]);

  // Once the new image has faded in, drop the one under it.
  useEffect(() => {
    if (layers.length < 2) return;
    const timer = setTimeout(() => setLayers((prev) => prev.slice(-1)), durationMs);
    return () => clearTimeout(timer);
  }, [layers, durationMs]);

  return (
    <div className={className ? `fade-image ${className}` : "fade-image"} style={style}>
      {layers.map((layer) => (
        <img
          key={layer.key}
          className="fade-image__img"
          src={layer.src}
          alt={alt}
          style={{ animationDuration: `${durationMs}ms` }}
        />
      ))}
    </div>
  );
}
