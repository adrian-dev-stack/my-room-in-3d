# Room rendering measurements

Measured on 6 October 2026 in an isolated headless Microsoft Edge session on this workstation. The viewport was 1440 × 1000 CSS pixels, with device pixel ratio 2. Each measurement used a 4-second `requestAnimationFrame` sample after startup and a 1.5-second settling period. These numbers describe this workstation, not a guaranteed frame rate on other devices.

| Configuration | Frames per second | 95th percentile frame interval |
| --- | ---: | ---: |
| Original quality upgrade, run 1 | 27.7 | 90.4 ms |
| Original quality upgrade, run 2 | 28.3 | 90.3 ms |
| Auto, run 1 | 49.5 | 90.4 ms |
| Auto, run 2 | 54.7 | 83.4 ms |
| Smooth, run 1 | 66.4 | 62.6 ms |
| Smooth, run 2 | 68.1 | 62.5 ms |
| High, explicit selection | 26.1 | 104.3 ms |

The original scene continuously redrew two large monitor canvases at 20 Hz, a weather canvas at 24 Hz, and the clock every rendered frame. The monitor canvases alone contain about 4.4 million pixels. High DPI also increased the render area, alongside screen-space ambient occlusion and multiple bloom passes.

The initial isolation profile produced 28.7 FPS without ambient occlusion, 30.0 without occlusion or bloom, 32.0 after limiting DPR to 1, and 55.1 after also limiting monitor and weather texture refresh to 8 Hz. Texture refresh frequency was the largest measured contributor.

Resizing monitor canvases to half resolution at the original refresh rate made that profile slower, from 28.3 to 23.8 FPS. That experiment was discarded. The shipped version keeps the full-resolution textures and changes their refresh schedule instead. Arcade and rhythm game displays run at 30 Hz during play.

Auto starts with bloom, no ambient occlusion, a pixel budget, and decorative screen refresh at 8 Hz. After five startup samples, three consecutive samples below 42 FPS select Smooth for the remainder of that session or until another mode is selected. Smooth renders directly and reduces the physical pixel budget. High retains the more expensive effects and original texture refresh rates. All modes keep the room geometry and PBR materials. Rendering pauses when the document is hidden, and the clock uploads only when its displayed state changes.

For diagnosis, `?profile=1` exposes `window.__roomProfile` with the renderer, passes, screen managers, and quality controller. The normal page does not expose that diagnostic object. The quality helper tests guard pixel budgets, startup grace, sustained-slow-frame adaptation, and manual mode selection; the clock test guards state-change uploads.
