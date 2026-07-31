import { DESIGN_WIDTH, DESIGN_HEIGHT } from "@/config/design";

// --- CSS unit strings (for style props) ---

/** Convert design px to vw string */
export function px(value: number): string {
  return `${(value / DESIGN_WIDTH) * 100}vw`;
}

/** Convert design px to vh string */
export function pxh(value: number): string {
  return `${(value / DESIGN_HEIGHT) * 100}vh`;
}

/** Font size based on vh (scales with height) */
export function font(value: number): string {
  return pxh(value);
}

// --- Aspect-relative variants ---
// Use inside AspectRatioContainer. They scale with the container's actual size,
// which is published as the --aspect-w / --aspect-h CSS custom properties (in px).

/** Convert design px to a width-relative length based on AspectRatioContainer */
export function pxa(value: number): string {
  return `calc(${value / DESIGN_WIDTH} * var(--aspect-w))`;
}

/** Convert design px to a height-relative length based on AspectRatioContainer */
export function pxha(value: number): string {
  return `calc(${value / DESIGN_HEIGHT} * var(--aspect-h))`;
}

/** Font size based on AspectRatioContainer height */
export function fonta(value: number): string {
  return pxha(value);
}

/** Font size based on AspectRatioContainer width */
export function fontwa(value: number): string {
  return pxa(value);
}
