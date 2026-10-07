// Tiny hex color helpers for the procedural art.

export function hexToRgb(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h.slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex(r, g, b) {
  const c = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return '#' + c(r) + c(g) + c(b);
}

/** Linear mix of two hex colors, t = 0 -> a, 1 -> b. */
export function mix(a, b, t) {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  return rgbToHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t);
}

export const lighten = (c, t) => mix(c, '#ffffff', t);
export const darken = (c, t) => mix(c, '#000000', t);

/** Darker, slightly saturated outline color for a fill. */
export function ink(c, t = 0.55) {
  const [r, g, b] = hexToRgb(c);
  const m = Math.max(r, g, b);
  // push toward the dominant hue a little so outlines are not muddy gray
  const k = 1 - t;
  return rgbToHex(r * k * (r === m ? 1.05 : 0.9), g * k * (g === m ? 1.05 : 0.9), b * k * (b === m ? 1.05 : 0.9));
}

export function rgba(hex, a) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

export function luminance(hex) {
  const [r, g, b] = hexToRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}
