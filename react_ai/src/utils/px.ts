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
