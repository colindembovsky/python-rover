---
name: Mars Rover Mission Control
description: An orbital traverse map of Mars with a planner's grid, read from the back of a classroom.
colors:
  console-bg: "#0e1215"
  panel: "#161c20"
  panel-raised: "#1f282e"
  panel-hover: "#28333b"
  line: "#2c373f"
  line-strong: "#52626d"
  text: "#eef2f4"
  muted: "#a9b6bf"
  traverse-yellow: "#ffd23f"
  go-green: "#3ccf7f"
  go-bg: "#10261b"
  nogo-red: "#ff5a52"
  nogo-bg: "#2c1315"
  fault-amber: "#ffb000"
  fault-bg: "#2a2109"
  regolith: "#de9660"
  boulder-light: "#9a8572"
  boulder-dark: "#3b2c24"
  rover-white: "#f7f7f3"
  ink: "#121212"
typography:
  title:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "1.8rem"
    fontWeight: 800
    lineHeight: 1.35
    letterSpacing: "-0.015em"
  status:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 800
    lineHeight: 1.15
  body:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.35
  telemetry:
    fontFamily: "ui-monospace, SF Mono, Menlo, Consolas, Liberation Mono, monospace"
    fontSize: "1.45rem"
    fontWeight: 700
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
spacing:
  xs: "6px"
  sm: "8px"
  md: "12px"
  lg: "24px"
components:
  button:
    backgroundColor: "{colors.panel-raised}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
  button-primary:
    backgroundColor: "{colors.traverse-yellow}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
  tab-selected:
    backgroundColor: "{colors.text}"
    textColor: "{colors.console-bg}"
    rounded: "{rounded.md}"
  status-go:
    backgroundColor: "{colors.go-bg}"
    textColor: "{colors.text}"
    rounded: "{rounded.lg}"
  status-nogo:
    backgroundColor: "{colors.nogo-bg}"
    textColor: "{colors.text}"
    rounded: "{rounded.lg}"
  status-fault:
    backgroundColor: "{colors.fault-bg}"
    textColor: "{colors.text}"
    rounded: "{rounded.lg}"
---

# Design System: Mars Rover Mission Control

## Overview

The maze is an orbital photo of Mars with a planner's grid laid over it, read the way a rover driver reads a traverse map. Around it sits quiet slate chrome that reports like mission telemetry. The audience is a classroom watching a projector, so every decision trades realism against legibility, and legibility wins. Squares stay countable, waypoint numbers stay large, and every state pairs a shape and a word with its colour.

Everything on the map is drawn in `web/app.js` on one canvas. The regolith is procedural and seeded by the maze name, so a maze looks the same every time. Nothing is fetched at runtime.

## Colors

### Primary
- **Traverse yellow** (`#ffd23f`): the planned route line, the waypoint plates, the Solve button and the battery units spent on the route. Yellow always means "the plan".

### Status
- **GO green** (`#3ccf7f` on `#10261b`): reachable, route found, target reached.
- **NO-GO red** (`#ff5a52` on `#2c1315`): blocked, edge of the map, no route, not reachable, short on battery.
- **FAULT amber** (`#ffb000` on `#2a2109`, with black hazard stripes): code that is not written yet ("Bounds check not implemented").

### Surface (canvas only)
- **Regolith** (around `#de9660`, varied ±25% by noise, wind ripples and grain): butterscotch Martian sand.
- **Boulder** (`#9a8572` lit face to `#3b2c24` shadow side) with a near-black edge.
- **Rover white** (`#f7f7f3`) and **ink** (`#121212`) for the rover, the target crosshair and waypoint numerals.

### Neutral
- Console `#0e1215`, panels `#161c20` / `#1f282e` / `#28333b`, lines `#2c373f` / `#52626d`, text `#eef2f4`, muted text `#a9b6bf`.

### Named Rules
- **Never colour alone.** GO is a tick in a circle with the word GO. NO-GO is an octagon with a cross on a striped badge with the word NO-GO. FAULT is a triangle on hazard stripes with the word FAULT. Battery shortfall segments are dashed and hatched, not just red.
- **Yellow is the plan.** Don't use traverse yellow for anything that is not the route, its waypoints or the action that makes it.

## Typography

System fonts only, so the app works offline. Base size is 18px (16px under 900px wide).

### Hierarchy
- Title: 1.8rem / 800.
- Status title: 1.75rem / 800. This is the line the class reads, so it is the largest text in the chrome.
- Status detail: 1.05rem, muted.
- Panel headings ("Drive", "Plan"): 1.1rem / 800, muted.
- Telemetry values (position, moves, battery readout) and map coordinates: monospace, bold. Monospace is only for numbers that are measurements.
- Waypoint numerals: 0.31 × square size (0.27 for two digits), 800 weight, ink on yellow.

## Layout

The first view at 1280×720 has no scrolling. Title and maze tabs sit at the top. A full-width status strip shows the badge, the message and the telemetry. Below it the map is on the left, with coordinates on all four sides, and a 300px rail on the right holds Drive and Plan. The map sizes its squares to fit the remaining viewport height, from 22px to 88px each. Under 900px the rail drops below the map.

## Elevation & Depth

On the map, everything that stands up casts a shadow to the east, because the light comes from the west. That covers boulders, the rover and waypoint plates, and craters are shaded the same way. Chrome uses one soft drop shadow on the status strip and a small raised shadow on buttons that flattens when pressed.

## Shapes

Corners are 6px on controls, 8px on panels and 4px on badges. On the map, boulders are irregular nine-sided lumps, the target is a ring with four crosshair ticks, the start is a dashed ring, and waypoints are circles.

## Components

### Buttons
Slate with a 1px strong-line border. The selected maze tab is inverted (light on dark becomes dark on light). Solve is the only yellow button. The focus ring is a 3px white outline.

### Status strip
A badge (shape plus word), the title and detail, and a telemetry list (position and moves). The `data-kind` attribute (`info`, `good`, `bad`, `todo`) selects the badge. On `bad` and `todo` the strip nudges sideways once. That is the only authored motion, and it is off under reduced motion.

### Battery gauge
One segment per unit (dense when there are more than 24, and hidden when there are more than 60). Yellow means spent on the route, white means spare, and hatched dashed red means missing. Below it is a readout of Needed / Battery / Spare (or Short).

### Map pieces
- **Rover:** seen from above, with six wheels on rocker-bogie arms, a white deck, a power unit at the back and a mast with twin cameras at the front. It rotates to face the last direction it was driven.
- **Wheel tracks:** two parallel lines behind the rover along every square it has driven through since load or reset.
- **Route:** a yellow line over a dark under-stroke, with plates numbered 1…n. The last number is the move count. On the target square the plate moves to the corner so the crosshair stays visible.

## Do's and Don'ts

### Do:
- Keep the grid visible over the texture, with a dark line and a faint light edge.
- Keep waypoint numbers big enough to count from the back of the room.
- Draw new map features with the same west light and east shadow.
- Show only the controls that exist at the current checkpoint.

### Don't:
- Don't fetch fonts, images or scripts at runtime.
- Don't let texture contrast compete with the rover, target, rocks or route.
- Don't use neon glows, gradient text or decorative monospace.
- Don't hide or round off anything the server reported. The off-by-one demo depends on the screen showing exactly what the code said.
