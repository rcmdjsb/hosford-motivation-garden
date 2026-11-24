# Hosford Motivation Garden — Project Rules & Architecture

## Overview
**Hosford Motivation Garden** is a zero-build, interactive 3D student self-reflection web experience designed for Hosford Middle School students on school Chromebooks and deployable directly to static hosting (such as Vercel).

## Technology Stack
- **Rendering:** Three.js `0.187.0` loaded via native ES Module `importmap` from `cdn.jsdelivr.net`.
- **No Build Step:** Pure HTML5, CSS3, and modular ES2022 JavaScript (`index.html`, `style.css`, `stations.js`, `garden.js`, `ui.js`).
- **Persistence:** Client-side `localStorage` (`hosford_motivation_garden_v1`) with automatic saving on every input change.

## Hosford Husky Twilight Palette
| Token | Hex | Usage |
| :--- | :--- | :--- |
| `--navy-midnight` | `#061A22` | Twilight sky, exponential fog, deep canvas background |
| `--teal-slate` | `#092631` | Stone stepping paths, shrine stonework, glassmorphism modal fill |
| `--teal-primary` | `#1F7A99` | Fountain water, stylized foliage, accent controls, unlit beacons |
| `--cyan-glow` | `#7CC9E8` | Illuminated lanterns, beacons, fireflies, modal borders, radar chart |
| `--white-crisp` | `#FFFFFF` | Primary text, warm highlights, crystal cores, starlight |

## File Responsibilities
1. **`index.html`** — Semantic document shell, Three.js `0.187.0` importmap, HUD containers, Shrine Reflection dialog, and Central Fountain Blueprint Card dialog.
2. **`style.css`** — Hosford Husky palette custom properties, glassmorphism panels, accessible focus states, Chromebook-responsive layouts, and `@media print` rules for clean PDF/paper export.
3. **`stations.js`** — Source of truth for the 4 Motivation Shrines (including each shrine's 3D Animal Guide dialogue), Central Fountain metadata, 10 overhead **Sky of Stories** constellations (motivational quotes, verified resilience videos, and true stories of overcoming challenges—all with YouTube embeds), palette tokens, `localStorage` load/save/reset helpers, completion checks, and plain-text Google Classroom summary generator.
4. **`garden.js`** — Self-contained Three.js 3D sanctuary engine: low-poly twilight geometry (fountain, stone paths, 4 distinct shrines each accompanied by an animated low-poly 3D Animal Guide that tracks the student's gaze and reacts on click, perimeter pines, fireflies, starry sky with clickable overhead constellations & shooting stars), Chromebook-friendly movement (WASD/Arrows + boundary collision), Click-and-Drag / touch look (tilting up to 73° into the sky) + optional Pointer Lock, Quick-Travel camera gliding, smooth Sky Gaze toggle, raycast interaction, and shrine completion animations (lantern ignition, cyan beacon shift, glowing crystal-tree growth).
5. **`ui.js`** — Application controller wiring `garden.js` and `stations.js` to the HUD, Quick-Travel bar, interactive 3D Animal Guide speech cards (with multi-tip dialogue and optional `speechSynthesis` Read Aloud), overhead Sky Constellation markers & **Sky of Stories** modal, Shrine Reflection overlay, custom SVG 4-axis Motivation Radar Chart, clipboard export, print trigger, and completion celebration toasts.
6. **`PROJECT_RULES.md`** — Architectural guidelines and design constraints.

## Chromebook 60fps Performance Rules
- Cap renderer pixel ratio at `Math.min(window.devicePixelRatio, 1.5)` to keep WebGL fill-rate fast on integrated Chromebook GPUs.
- Reuse shared `BufferGeometry` and `Material` instances across stepping stones, perimeter trees, crystals, and rocks.
- Use `InstancedMesh` for repetitive environment props (perimeter foliage and stones) to minimize draw calls.
- Avoid heavy real-time shadow maps; combine `HemisphereLight`, directional moonlight, and selective low-cost `PointLight` + emissive materials for crisp twilight atmosphere.
- Pause 3D movement inputs cleanly whenever a reflection or summary dialog is open.

## Accessibility & Classroom Readiness
- All interactive modals trap keyboard focus cleanly, dismiss with `Escape`, and restore focus upon closing.
- Navigation works via **WASD / Arrow keys**, **Click-and-Drag / Touch-Drag look**, **optional Pointer Lock**, **direct beacon clicks**, and the **Quick-Travel HUD bar**.
- The Central Fountain Blueprint Card includes both **Copy Summary to Clipboard** (formatted for Google Classroom) and **Print / Save PDF** with ink-friendly print styling.

## Deployment (Vercel / Static Hosting)
Deploy this directory directly to Vercel with **Framework Preset: Other** and no build command. All files resolve via relative paths (`./style.css`, `./ui.js`, `./garden.js`, `./stations.js`).
