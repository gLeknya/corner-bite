# Architecture and API Reference

> For the main documentation and quick start guide, see [README.md](README.md).

---

## Architecture

Strict 4-layer architecture: Core (geometry) has zero dependency on DOM/browser.

---

## Animation and Scheduler

### 1. Built-in Interpolator (`animate`)

The `animate` function interpolates **numeric geometry coordinates** (not the SVG string), recalculating the correct path every frame.

```javascript
import { animate } from './src/index.js';

const anim = animate(controller, [
  { x: 50, y: 50, w: 300, h: 200 }
], {
  duration: 400,
  easing: 'easeInOutCubic', // 'linear' | 'easeInCubic' | 'easeOutCubic' | 'easeInOutCubic' | (t) => number
  onUpdate: (geo) => console.log('Current:', geo)
});

// Cancel animation if needed:
// anim.cancel();

// Wait for completion:
await anim.finished;
```

### 2. External Animation Engines (GSAP, Anime.js, requestAnimationFrame)

The `controller.update(newGeometry)` method is cheap, side-effect-free, and safe to call on every frame:

```javascript
gsap.to(rect, {
  x: 200,
  y: 150,
  duration: 0.5,
  onUpdate: () => controller.update([rect])
});
```

### 3. Automatic Tracking (`follow`)

In `joinShapes`:
- `follow: false` (default): redraws on `ResizeObserver` and `window.resize`.
- `follow: true`: listens to `transitionrun`, `animationstart` events and checks `element.getAnimations()`, automatically enabling per-frame position reading only during animations.
- `follow: 'always'`: continuous RAF loop (for animations driven by external scripts).

---

## Pixel Snapping (`snap`)

The `snap: true` parameter (enabled by default) eliminates sub-pixel blur and artifacts:
- **At rest (idle)**: coordinates are rounded to $1 / \text{devicePixelRatio}$.
- **During animation**: fractional coordinates are used for perfect smoothness.
- **After 120 ms** of no changes, a single final render snaps to physical screen pixels.
- Zoom changes (`devicePixelRatio`) automatically trigger a redraw.

---

## API Reference

### Core

#### `buildPath(input, options)`
Builds an SVG path `d` from a polygon `[{x, y, r?}]` or a list of rectangles `[{x, y, w, h}]`.
- **`input`**: `Point[] | Rect[] | Point[][]`
- **`options`**:
  - `radius`: convex corner radius (default 0).
  - `concaveRadius`: concave corner radius (defaults to `radius`).
  - `smoothing`: reserved for future continuous curvature (currently no-op).
  - `precision`: decimal places (default 3).
  - `bleed`: rectangle expansion before union, in px (default 0).

#### `unionRects(rects)`
Performs a 2D boolean union of rectangles. Returns an array of closed contours `Array<Array<{x, y}>>` with collinear vertices removed, sorted in clockwise (CW) winding order.

#### `roundedUnion(rects, options)`
Unions rectangles and immediately builds a rounded SVG `d` string.

### DOM

#### `attach(element, options)`
Attaches a rounded shape to a single element.
Returns a controller:
- `update(geometry)`: update coordinates.
- `setRadius(radius, concaveRadius?)`: change radius.
- `getPath()`: synchronously get the current `d` string.
- `destroy()`: idempotent cleanup (removes layer/styles).
- `svgElement`, `pathElement`: references to DOM elements.

#### `joinShapes(elements, options)`
Measures the actual bounding rectangles of passed elements relative to the nearest common positioned ancestor and builds a single unified contour.
- Options: `radius`, `concaveRadius`, `mode` (`'svg'|'clip'|'patches'`), `patchColor`, `follow` (`false|true|'always'`), `snap`, `bleed`.

#### `glue(container, options)`
Finds elements with `data-concave-part` inside the container and calls `joinShapes`.
- Method `refresh()`: re-scans the DOM.

---

## Design Decisions

1. **Exact discrete grid decomposition for `unionRects`**:
   Instead of floating-point geometric operations and epsilon segment comparisons, the rectangle union decomposes the plane into elementary rectangular cells via unique X and Y coordinates. This guarantees 100% reliability, zero self-intersections, and correct contour topology for any arrangement of blocks.

2. **Junction continuity and concave radius auto-clamping**:
   As blocks approach or separate, the contact length $L$ between them tends to zero. To prevent a shape "pop", the maximum concave corner radius at a junction is clamped to the current contact length ($r \le L_{contact}$). As a result, when $L \to 0$ the concave corner smoothly collapses to zero, and the transition to two separate blocks is completely seamless to the eye.

3. **Fixed path structure (`M L A ... Z`)**:
   For a contour with $N$ vertices, the `d` string always contains exactly 1 `M` command, $N$ `L` commands, $N$ `A` commands, and 1 `Z` command. When $r = 0$, the arc degenerates into a zero-length segment (`A 0 0 0 0 1 x y`). This allows browser engines to interpolate paths directly without command type changes.

4. **Core independence from DOM**:
   All modules in `src/core/` never access `window`, `document`, or `navigator`. They can run on the server (Node.js, SSR, Deno, Bun) and in workers.

5. **Deduplication in the shared scheduler**:
   If multiple updates are triggered for a single shape within one frame, the contour is recalculated only once. When geometry hasn't changed (within a $10^{-3}$ tolerance), recalculation is skipped entirely.
