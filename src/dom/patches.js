import { unionRects } from '../core/union.js';
import { calculateFillets } from '../core/fillet.js';

/**
 * Builds the SVG path 'd' string for concave corner patch overlays.
 *
 * @param {Array<import('../core/types.js').Rect>} rects
 * @param {import('../core/types.js').BuildPathOptions} [options]
 * @param {number} [precision=3]
 * @returns {string} SVG path string containing all patch wedges
 */
export function buildPatchesPath(rects, options = {}, precision = 3) {
  const contours = unionRects(rects);
  if (contours.length === 0) return '';

  const fmt = (n) => Number(n.toFixed(precision)).toString();
  const patchPaths = [];

  for (const contour of contours) {
    const fillets = calculateFillets(contour, options);
    for (const f of fillets) {
      if (!f.isConcave || f.r <= 0) continue;

      // Construct patch wedge:
      // Start at pStart, line to original sharp corner vertex, line to pEnd,
      // and circular arc back to pStart with opposite sweep (1)
      const p1 = `M ${fmt(f.pStart.x)} ${fmt(f.pStart.y)}`;
      const p2 = `L ${fmt(f.vertex.x)} ${fmt(f.vertex.y)}`;
      const p3 = `L ${fmt(f.pEnd.x)} ${fmt(f.pEnd.y)}`;
      const arc = `A ${fmt(f.r)} ${fmt(f.r)} 0 0 1 ${fmt(f.pStart.x)} ${fmt(f.pStart.y)} Z`;

      patchPaths.push(`${p1} ${p2} ${p3} ${arc}`);
    }
  }

  return patchPaths.join(' ');
}

/**
 * Resolves the solid fill color for patches.
 *
 * @param {HTMLElement[]} elements
 * @param {string} [patchColor]
 * @returns {string}
 */
export function resolvePatchColor(elements, patchColor) {
  if (patchColor) return patchColor;
  if (typeof window !== 'undefined' && elements && elements[0]) {
    try {
      const bg = window.getComputedStyle(elements[0]).backgroundColor;
      if (bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)') {
        return bg;
      }
    } catch {
      // Fallback
    }
  }
  return 'currentColor';
}
