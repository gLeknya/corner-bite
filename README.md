# corner-bite

A library for creating and smoothly animating shapes with rounded **convex** and **concave** ("bitten") corners in HTML/CSS/JS.

Built for desktop and web interfaces (panels, cards, players, sidebars, tabs) where blocks connect with smooth rounded transitions at junctions and animate without shape jumps.

- **0 runtime dependencies.**
- **Pure JavaScript (ES Modules)** — works in the browser as-is, no bundlers or transpilers needed.
- **Built-in tests via `node --test`.**

> For architecture details, full API reference, and animation internals, see [ARCHITECTURE.md](ARCHITECTURE.md).

---

## Quick Start

### 1. Installation / Import

Since the library is written in pure ES modules, you can import it directly:

```javascript
import { attach, joinShapes, glue, setGradient, animate, buildPath } from './src/index.js';
```

### 2. Rounding a single element or arbitrary polygon (`attach`)

```javascript
const box = document.getElementById('my-box');

const controller = attach(box, {
  rects: [
    { x: 0, y: 0, w: 200, h: 100 },
    { x: 100, y: 100, w: 100, h: 80 }
  ],
  radius: 16,        // Radius for convex corners
  concaveRadius: 16, // Radius for concave corners (defaults to radius)
  mode: 'svg'        // 'svg' (default) or 'clip'
});

// Update radius:
controller.setRadius(24);

// Cleanup on unmount:
controller.destroy();
```

### 3. Joining two independent DOM elements (`joinShapes`)

Combines bounding rectangles of real elements and builds a **single unified contour** with concave rounded transitions at junctions:

```html
<div class="panel-container" style="position: relative;">
  <div id="sidebar" style="background: transparent;">Menu</div>
  <div id="player" style="background: transparent;">Player</div>
</div>
```

```javascript
import { joinShapes } from './src/index.js';

const shape = joinShapes([sidebar, player], {
  radius: 20,
  concaveRadius: 20,
  follow: true // Automatically tracks CSS transitions / WAAPI animations
});
```

### 4. Automatic assembly via attributes (`glue`)

```html
<div id="app" style="position: relative;">
  <div data-concave-part>Panel</div>
  <div data-concave-part>Tab</div>
</div>
```

```javascript
import { glue } from './src/index.js';

const g = glue('#app', { radius: 16 });

// If elements were added dynamically:
g.refresh();
```

---

## Rendering Modes Comparison

| Mode | How it works | Pros | Limitations |
|---|---|---|---|
| **`mode: 'svg'`** *(default)* | Absolutely positioned `<svg>` under content (`pointer-events: none`) with `<path>`. | Perfect for gradients, strokes, shadows (`filter: drop-shadow`), brightness adjustments on the entire shape. | Element backgrounds must be `transparent`. |
| **`mode: 'clip'`** | Sets `clip-path: path('...')` directly on the element. | Clips content inside the element, supports `conic-gradient`, background images, and `backdrop-filter`. | Native `border` and `box-shadow` get clipped by the browser; shadows require `filter: drop-shadow` on the parent; strokes need a separate layer. |
| **`mode: 'patches'`** | Small concave patches are drawn on top of elements at junctions. | Elements keep their own opaque CSS backgrounds. | Solid colors only (no transparency, gradients, or `backdrop-filter`). Color is set via `patchColor` option or taken from the first element's background. |

---

## Styling and CSS Variables

In `svg` mode, the layer is styled via standard CSS variables:

```css
.corner-bite-layer {
  --cb-fill: #3b82f6;           /* Fill color (defaults to currentColor) */
  --cb-stroke: #60a5fa;         /* Stroke color (defaults to none) */
  --cb-stroke-width: 2px;       /* Stroke width (defaults to 0) */
  filter: drop-shadow(0 12px 24px rgba(0, 0, 0, 0.4));
  transition: filter 0.2s ease;
}
```

### Gradients (`setGradient`)

A helper that creates `<defs>` with a unique `id` and assigns the gradient to `--cb-fill`:

```javascript
import { setGradient } from './src/index.js';

// Linear gradient with angle
setGradient(controller, {
  type: 'linear',
  angle: 135,
  stops: ['#ec4899', '#8b5cf6', '#3b82f6']
});

// Radial gradient
setGradient(controller, {
  type: 'radial',
  stops: [
    { offset: 0, color: '#38bdf8', opacity: 1 },
    { offset: 1, color: '#0f172a', opacity: 0.8 }
  ]
});
```

---

## Roadmap

### Done

- [x] **Convex and concave corner rounding** — full support for both convex and concave ("bitten") corners with independent radius control.
- [x] **Zero runtime dependencies** — pure JavaScript, no external packages.
- [x] **Pure ES Modules** — works in the browser without bundlers or transpilers.
- [x] **Built-in test suite** — runs via `node --test`, no third-party test frameworks needed.
- [x] **4-layer architecture** — Core (geometry) is fully independent of DOM/browser.
- [x] **Three rendering modes** — `svg`, `clip`, and `patches` for different use cases.
- [x] **CSS variables and gradient helpers** — `--cb-fill`, `--cb-stroke`, `setGradient()`.
- [x] **Built-in animation interpolator** — `animate()` interpolates geometry numerically, not SVG strings.
- [x] **External animation engine support** — works with GSAP, Anime.js, `requestAnimationFrame`.
- [x] **Automatic tracking (`follow`)** — listens to CSS transitions and WAAPI animations automatically.
- [x] **Pixel snapping (`snap`)** — sub-pixel alignment in idle, smooth fractional coords during animation.
- [x] **`translate` and `scale` transforms** — fully supported in DOM mode.

### Planned

- [ ] **Curved sides** — currently only straight-edge polygons are supported. The `fillet.js` layer architecture is already extracted into a separate strategy, ready for Bézier arc segments on sides.
- [ ] **`smoothing` parameter** — reserved in options. Future versions will add a continuous curvature algorithm (squircle / superellipse, G2 continuity).
- [ ] **Gooey effect (bridge across gap)** — planned as a separate mode for connecting blocks across a distance.
- [ ] **Holes inside shapes** — will be supported via the `fill-rule="evenodd"` fill rule.
- [ ] **Element rotation (`rotate`)** — arbitrary rotations in DOM mode require full 2D polygonal clipping at arbitrary angles.

---

## Demo Page

To run the demo page, use any local web server (browsers block ES module loading over the `file://` protocol):

```bash
# Via npx serve:
npx serve .

# Or via Python:
python -m http.server 8000
```

Open `http://localhost:8000/demo/index.html`.

The demo includes 4 interactive scenes:
1. **Stepped shape** — a reference shape made of 3 rectangles.
2. **Two-block junction with animation** — a panel and a sliding player with an overlap slider and auto-animation.
3. **Styling** — linear and radial gradients, strokes, brightness filters and shadows.
4. **Clip mode** — conic gradient and `backdrop-filter` on a colorful background.

---

## Testing

Run tests without any third-party packages using the built-in Node.js test runner:

```bash
npm test
```
