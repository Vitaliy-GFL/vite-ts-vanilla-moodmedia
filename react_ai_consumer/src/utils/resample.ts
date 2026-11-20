// Scales a loaded image to width × height device pixels with a centred cover crop, halving
// it step by step. Use it when a big upload (e.g. 1920×1080 from a playlist) goes into a
// small slot: the player downscales in one bilinear step that reads only a few source
// pixels, and the picture comes out pixelated. An exact 2× step from whole pixels averages
// every 2×2 block, so only the last step, under 2×, is a plain bilinear one.
// Neither imageSmoothingQuality nor createImageBitmap's resizeQuality is a substitute: the
// first only picks a filter, possibly the one the player already gets wrong, and Chromium
// ignores the second for a cropped bitmap. Desktop Chrome downscales well on its own, so
// the difference only shows on a player.
//
// Draw the result into a <canvas> sized to the slot:
//   canvas.width = w; canvas.height = h; canvas.getContext("2d")?.drawImage(resample(img, w, h), 0, 0);
// with w/h = the slot's getBoundingClientRect() size × devicePixelRatio (rounded here).
// Learned on Volvo Delivery (custom/volvo/delivery, CarModelGrid.tsx).
export function resample(img: HTMLImageElement, width: number, height: number): HTMLCanvasElement {
  // A canvas size is a whole number; a fractional target would never be reached.
  width = Math.round(width);
  height = Math.round(height);
  if (!(width > 0 && height > 0 && img.naturalWidth > 0 && img.naturalHeight > 0)) {
    throw new Error(`resample: bad size ${width}×${height} (image ${img.naturalWidth}×${img.naturalHeight})`);
  }
  const scale = Math.max(width / img.naturalWidth, height / img.naturalHeight);
  let source: CanvasImageSource = img;
  let sw = Math.round(width / scale);
  let sh = Math.round(height / scale);
  let sx = Math.round((img.naturalWidth - sw) / 2);
  let sy = Math.round((img.naturalHeight - sh) / 2);
  for (;;) {
    const halveX = sw >= width * 2;
    const halveY = sh >= height * 2;
    const canvas = document.createElement("canvas");
    canvas.width = halveX ? Math.floor(sw / 2) : width;
    canvas.height = halveY ? Math.floor(sh / 2) : height;
    // A halving step reads exactly twice its size, dropping an odd last pixel.
    const readW = halveX ? canvas.width * 2 : sw;
    const readH = halveY ? canvas.height * 2 : sh;
    canvas.getContext("2d")?.drawImage(source, sx, sy, readW, readH, 0, 0, canvas.width, canvas.height);
    if (canvas.width === width && canvas.height === height) return canvas;
    [source, sx, sy, sw, sh] = [canvas, 0, 0, canvas.width, canvas.height];
  }
}
