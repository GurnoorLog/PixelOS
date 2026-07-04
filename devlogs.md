# glassOS — Workshop Devlogs

## Entry 1: The Identity — Glassmorphism × Pixel Art

**Date:** 2026-06-20

The core concept hit me while staring at a frosted window in a coffee shop with an old Game Boy sitting on the table. The contrast was arresting — the smooth, blurred distortion of light through glass, set against the rigid, sharp-edged pixels of a 90s handheld. I knew immediately that this friction was the identity.

The technical challenge was making both aesthetics breathe together without one overwhelming the other. Glassmorphism demands `backdrop-filter: blur()` and layered translucency; pixel art demands crisp, integer-scaled geometry with zero anti-aliasing. The solution was strict separation of concerns: glass for the UI chrome (windows, dock, status bar), pixels for the content layer (typography via `Press Start 2P`, all application icons as hand-authored 12×12 sprites, the cursor, the decorative elements).

The `--glass-bg` / `--glass-border` CSS custom property system was crucial. Every glass element shares a unified backdrop-filter layer that blurs whatever is behind it — including the HTML canvas pixel rain. This means the rain falls _behind_ the windows, and the `backdrop-filter` on each `.window` naturally blurs it. No compositing hacks needed.

The pixel art sprites are defined as 2D arrays of color indices. A single `renderSprite()` function iterates over the grid, calls `ctx.fillRect()` for each non-transparent cell, and outputs a crisp canvas. This function is called once at `DOMContentLoaded` for every element with `data-sprite`, whether it's a dock icon, window title icon, or start menu entry. The scale parameter lets the same sprite data render at 14px for window headers and 28px for the dock.

The glitch text effect on the status bar was a last-minute addition — pure CSS `::before`/`::after` with `content: attr(data-text)` and offset clips. It took ten lines and elevated the whole top bar.

## Entry 2: The Drag Engine — Z-Index, Boundaries, and Flow

**Date:** 2026-06-21

Window dragging sounds trivial until you account for: z-index stacking, desktop boundary clamping, mouse event capture across iframes, and the interaction between drag and the floating dock.

The architecture is a single `dragState` object that gets set on `mousedown` on any `.window-header` and cleared on `mouseup`. The critical detail is that the event listener is on `document`, not on the window elements themselves — this guarantees that even if the mouse moves faster than the frame rate and exits the window boundary, the drag continues uninterrupted.

Z-index management is handled by a monotonically increasing counter. Every `mousedown` on a window calls `bringToFront()`, which sets the window's `zIndex` to `++zIndexCounter`. The counter is a simple integer, never reset, never reused — mathematically equivalent to "most recent interaction wins." I added a safety check that scans all windows and recalibrates the counter from the max found value, which prevents drift if windows are programmatically created or destroyed.

The boundary clamping was the trickiest part. The desktop area sits between the top bar (`44px` high) and the dock (`72px` from bottom). Windows must not be draggable outside this viewport. The clamp calculation:

```js
var maxX = s.desktopRect.width - s.win.offsetWidth;
var maxY = s.desktopRect.height - s.win.offsetHeight;
x = Math.max(0, Math.min(x, maxX));
y = Math.max(0, Math.min(y, maxY));
```

The `offsetWidth`/`offsetHeight` includes borders, so the window edge never leaves the desktop.

I also discovered that `requestAnimationFrame` wasn't needed here — `mousemove` fires at pointer sampling rate anyway, and the GPU compositing of `transform`/`top`/`left` is already off-thread in modern browsers. Adding RAF would just introduce a frame of latency.

The minimize animation uses a CSS transition on `opacity` and `transform` with `scale(0.5) translateY(60px)`. The `pointer-events: none` on the minimized class prevents accidental interaction while invisible. Restoring via the dock calls `openApp()` which removes the class and resets the minimize button text.

## Entry 3: Pixel Rain — Canvas Compositing Behind Glass

**Date:** 2026-06-22

The pixel rain is the single most important visual effect in the night theme, and it had to meet three constraints: render at 60fps, appear to fall _behind_ the glass windows (literally in the z-index stack between the background and the UI), and use pixel-art-style raindrops rather than smooth lines.

Each raindrop is modeled as a simple class with `x`, `y`, `speed`, `len`, `width`, and `opacity`. The width is always 2px (pixel-perfect), and the length varies from 6 to 20 pixels in 2px increments. This gives the characteristic "8-bit rain" look — chunky, stepped, unapologetically retro.

The rendering loop is straightforward `requestAnimationFrame` with `clearRect` on every frame. 80 drops are active at any time. Each drop draws itself as a vertical strip of 2×2 pixel blocks:

```js
for (var i = 0; i < this.len; i += 2) {
  ctx.fillRect(this.x, this.y - i, this.w, 2);
}
```

A brighter pixel at the head of each drop simulates the "streak" effect. The hue is randomized between 220–280 (cyan to purple) with an HSL string, which creates the subtle neon color variation across the rain field.

The compositing trick: the `<canvas id="rain-canvas">` sits at `z-index: 1`, above `#bg-gradient` at `z-index: 0` but below the desktop `#desktop` at `z-index: 2` and the windows inside it. The glass windows have `backdrop-filter: blur(16px)`. This means the canvas renders pixel rain → the browser composites it with the background gradient → the glass panels above it blur the combined result. The rain is authentically "behind the glass."

Performance was a concern — 80 drops × 10 fillRect calls each = 800 draw calls per frame. But `fillRect` is one of the fastest Canvas2D operations (no path parsing, no anti-aliasing for axis-aligned rects), and it runs at a solid 60fps even on mid-range hardware. I added a `resizeRain()` handler on window resize to re-dimension the canvas and redistribute drops proportionally.

The day/night toggle simply flips `opacity` on the rain canvas with a CSS transition. No drops are destroyed or created — they just become invisible, and the `requestAnimationFrame` loop keeps running (at near-zero cost since `clearRect` + zero visible draws is trivially fast).

One detail that made a big visual difference: adding `pointer-events: none` to the rain canvas. Without it, the canvas would intercept mouse events and break window dragging. With it, the rain is purely decorative and completely transparent to interaction.

The final polish was adding a `box-shadow: inset 0 0 100px rgba(120, 80, 255, 0.05)` on the rain canvas during night mode, which creates a subtle vignette that blends the rain into the dark edges of the screen.
