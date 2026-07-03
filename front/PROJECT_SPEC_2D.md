# Specification: 2D Virtual WFH Office

This document contains a comprehensive specification designed for an AI agent to read, parse, and recreate this interactive "Virtual WFH Office" project in a **2D format** (e.g., using HTML5 Canvas, SVG, or isometric CSS Grid/sprites).

---

## 1. Core Architecture & Theme

### Concept
An interactive, isometric, or top-down 2D virtual workspace representing a WFH (Work From Home) environment. It allows a customizable player avatar to move around, interact with desks, and work alongside typing/bobbing colleagues.

### Audio-Reactivity (The Key Dynamic Element)
The workspace must react to the user's microphone/audio input:
1. **Lamps & Laptop Screens**: Pulsate in intensity/color based on live audio volume.
2. **Avatar Action**: The avatar waves arms or bobs intensely when the volume exceeds a threshold.
3. **Emoji Spawner**: Floating emoji particles (`❤️`, `😂`, `🔥`, etc.) spawn above the player when they speak.

---

## 2. Layout & Coordinates

### Room Grid
- **Logical Dimension**: `14.8` units wide x `8.4` units deep.
- **Floor**: Planks rendered with 5 repeating theme-dependent colors (cream wood tones for Day, warm peach-roses for Sunset, deep violets for Night).

### Desk Configuration
Generate **20 desks** in a double-block layout (facing each other in rows):
- **Double-Row 1 (Back Block)**:
  - Line 1 (Facing Up): 5 desks at X-coords `[-5.2, -2.6, 0.0, 2.6, 5.2]`, Z-coord `-2.6`
  - Line 2 (Facing Down): 5 desks at X-coords `[-5.2, -2.6, 0.0, 2.6, 5.2]`, Z-coord `-1.6`
- **Double-Row 2 (Front Block)**:
  - Line 1 (Facing Up): 5 desks at X-coords `[-5.2, -2.6, 0.0, 2.6, 5.2]`, Z-coord `1.6`
  - Line 2 (Facing Down): 5 desks at X-coords `[-5.2, -2.6, 0.0, 2.6, 5.2]`, Z-coord `2.6`

Each desk has random prop variations:
- **Laptops**: Glow-active screen.
- **Lamps**: Emits audio-reactive point lighting.
- **Plants**: Potted decoration.
- **Mug**: Clickable to trigger coffee sipping animation.

---

## 3. Assets & Styling

### 2D Rendering Options
1. **Isometric Canvas/Sprites (Recommended)**: Render elements at a 45-degree angle projection.
2. **Flat Top-Down View**: Flat 2D grid representation (similar to RPG Maker maps).

### Theme Palettes
- **Day**:
  - Background: `#ffffff` (light grey/white walls).
  - Planks: `['#fdfcfa', '#fafaf9', '#f5f5f4', '#e7e5e4', '#e2e8f0']`
  - Lights: White / soft blue screens.
- **Sunset**:
  - Background: `#fecdd3` (warm orange/rose walls).
  - Planks: `['#fda4af', '#fca5a5', '#fdba74', '#fed7aa', '#ffe4e6']`
  - Lights: Peach / warm amber.
- **Night**:
  - Background: `#13132b` (cyber indigo/neon walls).
  - Planks: `['#1e1b4b', '#312e81', '#111827', '#0f172a', '#020617']`
  - Lights: Neon violet screen glowing, glowing pink lamps.

---

## 4. NPC Colleagues

- **Total NPC Count**: 19 (occupying all non-active desks).
- **Idle Behavior**: 
  - Periodic head bobbing (sinusoidal scaling or rotation).
  - Arms swing dynamically to simulate keyboard typing.
- **Variability**: Randomly generated skin tones, clothing colors, hair styles (short, long, cap), glasses, and headphones.

---

## 5. Player Avatar & Pathfinding

### Player Options
- **Outfit**: Selectable clothing color, hair style, accessories (glasses, headphones).
- **States**: `Idle`, `Walking`, `Seated`, `Sipping`.

### Collision & Pathfinding (BFS Grid)
1. Treat the desks and walls as obstacles on a grid map.
2. When the user clicks the floor or a desk, calculate the shortest path avoiding desks.
3. Move the player avatar step-by-step along path waypoints at a speed of `3.2 units/second`.
4. Render leg swing and arm swing walking animations.
5. If arriving at a desk, position the player in the chair facing the laptop.

---

## 6. Particle System (Emoji Spawner)

- **Spawn Event**: Triggered when mic volume > `0.45` threshold (cooldown of `0.35s`).
- **Anatomy**: Renders emojis like `❤️`, `😂`, `✨`, `🎉`, `🔥`, `👍`, `🚀`.
- **Motion**:
  - Initial Position: Over the player's head.
  - Velocity: Slow drift upward (`Y-axis`) with minor random left/right drift (`X-axis`).
  - Lifespan: `1.2` seconds.
  - Scale: Grows quickly to full size, then shrinks to 0 prior to disposal.

---

## 7. Technical Implementation Steps (AI Blueprint)

To build this in 2D using HTML5 Canvas and Vanilla JS or React, follow these stages:

### Stage 1: Audio Input Setup
```javascript
// Quick code blueprint to measure volume
async function initAudioAnalyzer() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const source = audioContext.createMediaStreamSource(stream);
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;
  source.connect(analyser);

  const dataArray = new Uint8Array(analyser.frequencyBinCount);
  
  function getVolume() {
    analyser.getByteFrequencyData(dataArray);
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    return sum / dataArray.length / 255.0; // scale normalized [0.0, 1.0]
  }
  return { getVolume };
}
```

### Stage 2: Draw Loop (Canvas 2D Rendering)
In your `requestAnimationFrame` loop:
1. **Clear screen**.
2. **Draw floor tiles/planks**: Loop over plank indexes, map 2D coordinates `(x, y)` to isometric screen position `(isoX = x - y, isoY = (x + y) / 2)`.
3. **Draw desks & chairs**: Order drawing from back-to-front (depth sorting) so elements overlay correctly.
4. **Update & draw NPCs**: Bob head Y position and offset hand drawing X positions for typing.
5. **Update & draw Player**: Move along BFS path nodes. Apply walking animation state.
6. **Update & draw Emoji Particles**: Increment age, adjust scale, draw character string at particle coordinates, remove expired instances.
7. **Apply Glow overlay**: Draw a semi-transparent radial gradient at active lamps, using `getVolume()` to dynamically scale the radius and opacity.
