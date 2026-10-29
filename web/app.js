// Mission Control page. This file only draws the map and talks to the Python server.
// All the rover rules live in Python (the rover/ package).

const canvas = document.getElementById("map");
const ctx = canvas.getContext("2d");
const boardWrap = document.getElementById("board-wrap");
const statusCard = document.getElementById("status");
const statusTitle = document.getElementById("status-title");
const statusDetail = document.getElementById("status-detail");
const mazeTabs = document.getElementById("maze-tabs");
const telemetryPosition = document.getElementById("tm-position");
const telemetryMoves = document.getElementById("tm-moves");

const COLORS = {
  frame: "#0e1215",
  coordinate: "#d9e1e6",
  gridDark: "rgba(38, 16, 4, 0.55)",
  gridLight: "rgba(255, 236, 214, 0.22)",
  shadow: "rgba(28, 10, 2, 0.5)",
  track: "rgba(84, 38, 12, 0.5)",
  rockDark: "#3b2c24",
  rockLight: "#9a8572",
  rockEdge: "rgba(18, 8, 3, 0.9)",
  white: "#f7f7f3",
  ink: "#121212",
  route: "#ffd23f",
};

let state = null; // what the server says about the maze and the rover
let route = null; // the planned route, as a list of [row, col]
let heading = "up"; // which way the rover is facing, only used for drawing
let trail = []; // squares the rover has driven through, drawn as wheel tracks

async function api(path, body) {
  const options = body === undefined
    ? {}
    : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
  const response = await fetch(path, options);
  return response.json();
}

// ---------- Status strip ----------

// kind is "info", "good", "bad" or "todo". Each has its own badge shape and word, so colour is never the only clue.
function setStatus(kind, title, detail = "") {
  statusCard.dataset.kind = kind;
  statusTitle.textContent = title;
  statusDetail.textContent = detail;
  if (kind === "bad" || kind === "todo") {
    statusCard.classList.remove("bump");
    void statusCard.offsetWidth; // restart the animation
    statusCard.classList.add("bump");
  }
}

function showTelemetry() {
  telemetryPosition.textContent = `${state.rover[0]}, ${state.rover[1]}`;
  telemetryMoves.textContent = state.moves_made;
}

// ---------- Drawing ----------

let size = 60; // pixels per square
let margin = 34; // room for the printed row and column numbers

function layout() {
  const top = boardWrap.getBoundingClientRect().top + window.scrollY;
  const keyHeight = 48;
  const roomWide = boardWrap.clientWidth;
  const roomHigh = Math.max(260, window.innerHeight - top - keyHeight - 16);
  const fit = Math.min(roomWide / (state.cols + 0.9), roomHigh / (state.rows + 0.9));
  size = Math.floor(Math.max(22, Math.min(88, fit)));
  margin = Math.round(Math.max(24, size * 0.5));
}

function prepare(target, width, height) {
  const ratio = window.devicePixelRatio || 1;
  target.width = Math.round(width * ratio);
  target.height = Math.round(height * ratio);
  target.style.width = `${width}px`;
  target.style.height = `${height}px`;
  const context = target.getContext("2d");
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  return context;
}

function center(row, col) {
  return [margin + col * size + size / 2, margin + row * size + size / 2];
}

function draw() {
  if (!state) return;
  layout();
  const width = margin * 2 + state.cols * size;
  const height = margin * 2 + state.rows * size;
  prepare(canvas, width, height);

  drawFrame(width, height);
  ctx.drawImage(ground(), margin, margin, state.cols * size, state.rows * size);
  drawTracks();
  for (const [row, col] of state.rocks) drawRock(ctx, ...center(row, col), size, row * 131 + col * 7 + 3);
  drawGrid();
  drawStart(...center(...state.start));
  drawGoal(ctx, ...center(...state.goal), size);
  if (route) drawRoute();
  drawRover(ctx, ...center(...state.rover), size, heading);
  showTelemetry();
}

function drawFrame(width, height) {
  ctx.fillStyle = COLORS.frame;
  ctx.fillRect(0, 0, width, height);

  // Coordinates on all four sides, so the class can name any square.
  ctx.fillStyle = COLORS.coordinate;
  ctx.font = `700 ${Math.round(Math.min(19, margin * 0.58))}px ui-monospace, Menlo, Consolas, monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let col = 0; col < state.cols; col++) {
    const x = margin + col * size + size / 2;
    ctx.fillText(col, x, margin / 2);
    ctx.fillText(col, x, height - margin / 2);
  }
  for (let row = 0; row < state.rows; row++) {
    const y = margin + row * size + size / 2;
    ctx.fillText(row, margin / 2, y);
    ctx.fillText(row, width - margin / 2, y);
  }
}

// The planner's grid: a dark line with a faint light edge, so it shows on bright and dark ground.
function drawGrid() {
  const right = margin + state.cols * size;
  const bottom = margin + state.rows * size;
  for (const [style, offset, widthPx] of [[COLORS.gridDark, 0, 1.5], [COLORS.gridLight, 1.25, 1]]) {
    ctx.strokeStyle = style;
    ctx.lineWidth = widthPx;
    ctx.beginPath();
    for (let col = 0; col <= state.cols; col++) {
      const x = margin + col * size + offset;
      ctx.moveTo(x, margin);
      ctx.lineTo(x, bottom);
    }
    for (let row = 0; row <= state.rows; row++) {
      const y = margin + row * size + offset;
      ctx.moveTo(margin, y);
      ctx.lineTo(right, y);
    }
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(margin - 0.75, margin - 0.75, state.cols * size + 1.5, state.rows * size + 1.5);
}

// ---------- The ground: procedural regolith, the same every time for a given maze ----------

let groundCache = { key: "", image: null };

function random(seed) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function seedFrom(text) {
  let hash = 2166136261;
  for (const ch of text) hash = Math.imul(hash ^ ch.charCodeAt(0), 16777619);
  return hash >>> 0;
}

function noiseLayer(rand, cells) {
  const values = Array.from({ length: (cells + 1) * (cells + 1) }, rand);
  return (u, v) => {
    const x = u * cells;
    const y = v * cells;
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const fx = x - x0;
    const fy = y - y0;
    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);
    const at = (i, j) => values[Math.min(cells, j) * (cells + 1) + Math.min(cells, i)];
    const top = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * sx;
    const bottom = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * sx;
    return top + (bottom - top) * sy;
  };
}

function ground() {
  const width = state.cols * size;
  const height = state.rows * size;
  const key = `${state.maze}:${width}x${height}`;
  if (groundCache.key === key) return groundCache.image;

  const rand = random(seedFrom(state.maze));
  const image = document.createElement("canvas");
  image.width = width;
  image.height = height;
  const g = image.getContext("2d");

  const span = Math.max(state.cols, state.rows);
  const octaves = [[noiseLayer(rand, 3), 0.5], [noiseLayer(rand, span), 0.3], [noiseLayer(rand, span * 4), 0.2]];
  const grain = noiseLayer(rand, span * 14);
  const angle = rand() * Math.PI;
  const [ax, ay] = [Math.cos(angle), Math.sin(angle)];
  const pixels = g.createImageData(width, height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const u = x / width;
      const v = y / height;
      let n = 0;
      for (const [layer, weight] of octaves) n += layer(u, v) * weight;
      // Wind ripples: faint bands across the sand, bent by the large-scale noise.
      const ripple = Math.sin(((x * ax + y * ay) / size) * 9 + n * 10) * 0.035;
      const tone = 0.78 + (n - 0.5) * 0.45 + ripple + (grain(u, v) - 0.5) * 0.12 + (rand() - 0.5) * 0.05;
      const i = (y * width + x) * 4;
      pixels.data[i] = 222 * tone;
      pixels.data[i + 1] = 150 * tone;
      pixels.data[i + 2] = 96 * tone;
      pixels.data[i + 3] = 255;
    }
  }
  g.putImageData(pixels, 0, 0);

  // Small impact craters, lit from the west like the boulders.
  const craters = 2 + Math.floor(rand() * 3);
  for (let i = 0; i < craters; i++) {
    const cx = rand() * width;
    const cy = rand() * height;
    const r = size * (0.25 + rand() * 0.55);
    const bowl = g.createRadialGradient(cx - r * 0.25, cy - r * 0.25, r * 0.1, cx, cy, r);
    bowl.addColorStop(0, "rgba(255, 230, 200, 0.18)");
    bowl.addColorStop(0.6, "rgba(70, 30, 8, 0.22)");
    bowl.addColorStop(1, "rgba(70, 30, 8, 0)");
    g.fillStyle = bowl;
    g.beginPath();
    g.arc(cx, cy, r, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = "rgba(255, 228, 196, 0.14)";
    g.lineWidth = Math.max(1, r * 0.08);
    g.beginPath();
    g.arc(cx, cy, r * 0.92, -0.2 * Math.PI, 0.75 * Math.PI);
    g.stroke();
  }

  // Scattered pebbles too small to matter to the rover.
  const pebbles = state.cols * state.rows * 3;
  for (let i = 0; i < pebbles; i++) {
    const x = rand() * width;
    const y = rand() * height;
    const r = size * (0.01 + rand() * 0.025);
    g.fillStyle = "rgba(48, 22, 8, 0.45)";
    g.beginPath();
    g.arc(x + r * 0.6, y + r * 0.4, r, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "rgba(120, 82, 58, 0.9)";
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  }

  groundCache = { key, image };
  return image;
}

// ---------- Things on the ground ----------

function drawTracks() {
  if (trail.length < 2) return;
  ctx.strokeStyle = COLORS.track;
  ctx.lineWidth = Math.max(2, size * 0.07);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const side of [-0.2, 0.2]) {
    ctx.beginPath();
    trail.forEach(([row, col], i) => {
      const [x, y] = center(row, col);
      const [nextRow, nextCol] = trail[Math.min(i + 1, trail.length - 1)];
      const [prevRow, prevCol] = trail[Math.max(i - 1, 0)];
      const vertical = nextCol === prevCol && nextRow !== prevRow;
      const dx = vertical ? side * size : 0;
      const dy = vertical ? 0 : side * size;
      if (i === 0) ctx.moveTo(x + dx, y + dy);
      else ctx.lineTo(x + dx, y + dy);
    });
    ctx.stroke();
  }
}

function drawStart(x, y) {
  ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
  ctx.lineWidth = Math.max(2, size * 0.035);
  ctx.setLineDash([size * 0.08, size * 0.07]);
  ctx.beginPath();
  ctx.arc(x, y, size * 0.42, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
}

// Rocks: a lumpy boulder lit from the west, casting its shadow to the east.
function drawRock(c, x, y, s, seed = 7) {
  const rand = random(seed);
  const points = [];
  const corners = 9;
  const bulk = 0.27 + rand() * 0.06;
  for (let i = 0; i < corners; i++) {
    const a = (i / corners) * Math.PI * 2 + rand() * 0.3;
    const r = s * (bulk + rand() * 0.1);
    points.push([Math.cos(a) * r, Math.sin(a) * r * 0.9]);
  }
  const path = (dx, dy, stretch) => {
    c.beginPath();
    points.forEach(([px, py], i) => {
      const sx = x + dx + px * stretch;
      const sy = y + dy + py;
      if (i === 0) c.moveTo(sx, sy);
      else c.lineTo(sx, sy);
    });
    c.closePath();
  };

  c.fillStyle = COLORS.shadow;
  path(s * 0.13, s * 0.05, 1.12);
  c.fill();

  const body = c.createRadialGradient(x - s * 0.14, y - s * 0.14, s * 0.03, x, y, s * 0.42);
  body.addColorStop(0, COLORS.rockLight);
  body.addColorStop(0.55, "#5e4c40");
  body.addColorStop(1, COLORS.rockDark);
  c.fillStyle = body;
  path(0, 0, 1);
  c.fill();

  c.strokeStyle = COLORS.rockEdge;
  c.lineWidth = Math.max(1.5, s * 0.035);
  c.lineJoin = "round";
  path(0, 0, 1);
  c.stroke();

  // A crack across the face, different on every boulder.
  const tilt = rand() * Math.PI;
  const [tx, ty] = [Math.cos(tilt) * s * 0.14, Math.sin(tilt) * s * 0.14];
  c.strokeStyle = "rgba(25, 12, 6, 0.6)";
  c.lineWidth = Math.max(1, s * 0.02);
  c.beginPath();
  c.moveTo(x - tx, y - ty);
  c.lineTo(x + (rand() - 0.5) * s * 0.1, y + (rand() - 0.5) * s * 0.1);
  c.lineTo(x + tx, y + ty);
  c.stroke();
}

// Target: a white crosshair ring, like a marked site on an orbital map.
function drawGoal(c, x, y, s) {
  const r = s * 0.33;
  for (const [style, widthPx] of [["rgba(0, 0, 0, 0.7)", Math.max(5, s * 0.1)], [COLORS.white, Math.max(2.5, s * 0.05)]]) {
    c.strokeStyle = style;
    c.lineWidth = widthPx;
    c.lineCap = "butt";
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      c.moveTo(x + dx * r * 0.45, y + dy * r * 0.45);
      c.lineTo(x + dx * r * 1.35, y + dy * r * 1.35);
    }
    c.stroke();
  }
  c.fillStyle = COLORS.white;
  c.strokeStyle = "rgba(0, 0, 0, 0.7)";
  c.lineWidth = 2;
  c.beginPath();
  c.arc(x, y, Math.max(2.5, s * 0.06), 0, Math.PI * 2);
  c.fill();
  c.stroke();
}

const HEADINGS = { up: 0, right: Math.PI / 2, down: Math.PI, left: -Math.PI / 2 };

// Rover from above: six wheels, a white deck, the mast and camera at the front, the power unit at the back.
function drawRover(c, x, y, s, facing = "up") {
  c.save();
  c.translate(x, y);
  c.rotate(HEADINGS[facing]);

  c.fillStyle = COLORS.shadow;
  roundRect(c, -s * 0.3, -s * 0.33, s * 0.68, s * 0.74, s * 0.08);
  c.fill();

  // Rocker-bogie arms and wheels.
  c.strokeStyle = "#2a2a2a";
  c.lineWidth = Math.max(1.5, s * 0.03);
  for (const side of [-1, 1]) {
    c.beginPath();
    c.moveTo(side * s * 0.3, -s * 0.28);
    c.lineTo(side * s * 0.3, s * 0.28);
    c.stroke();
    for (const wy of [-0.28, 0, 0.28]) {
      c.fillStyle = COLORS.ink;
      roundRect(c, side * s * 0.3 - s * 0.075, (wy - 0.09) * s, s * 0.15, s * 0.18, s * 0.03);
      c.fill();
      c.fillStyle = "#555";
      for (const tread of [-0.05, 0, 0.05]) c.fillRect(side * s * 0.3 - s * 0.06, (wy + tread) * s, s * 0.12, Math.max(1, s * 0.012));
    }
  }

  // Deck.
  c.fillStyle = COLORS.white;
  c.strokeStyle = COLORS.ink;
  c.lineWidth = Math.max(1.5, s * 0.03);
  roundRect(c, -s * 0.2, -s * 0.24, s * 0.4, s * 0.44, s * 0.05);
  c.fill();
  c.stroke();
  c.fillStyle = "#c9ccd0";
  c.fillRect(-s * 0.14, -s * 0.02, s * 0.28, s * 0.03);

  // Power unit at the back.
  c.fillStyle = "#3c3f44";
  roundRect(c, -s * 0.07, s * 0.2, s * 0.14, s * 0.13, s * 0.025);
  c.fill();

  // Dish antenna.
  c.fillStyle = "#d8dadc";
  c.beginPath();
  c.arc(s * 0.09, s * 0.08, s * 0.065, 0, Math.PI * 2);
  c.fill();
  c.stroke();

  // Mast and camera head at the front, so you can see which way it faces.
  c.fillStyle = COLORS.ink;
  roundRect(c, -s * 0.1, -s * 0.36, s * 0.2, s * 0.1, s * 0.025);
  c.fill();
  c.fillStyle = COLORS.white;
  c.beginPath();
  c.arc(-s * 0.045, -s * 0.31, s * 0.022, 0, Math.PI * 2);
  c.arc(s * 0.045, -s * 0.31, s * 0.022, 0, Math.PI * 2);
  c.fill();

  c.restore();
}

// Route: a planned traverse with waypoints numbered 1, 2, 3... so the last number is the number of moves.
function drawRoute() {
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  for (const [style, widthPx] of [["rgba(0, 0, 0, 0.6)", Math.max(6, size * 0.14)], [COLORS.route, Math.max(3, size * 0.065)]]) {
    ctx.strokeStyle = style;
    ctx.lineWidth = widthPx;
    ctx.beginPath();
    route.forEach(([row, col], i) => {
      const [x, y] = center(row, col);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }

  route.forEach(([row, col], i) => {
    if (i === 0) return;
    const [x, y] = center(row, col);
    const atGoal = row === state.goal[0] && col === state.goal[1];
    // On the target square, the waypoint sits in the corner so the crosshair stays visible.
    const cx = atGoal ? x + size * 0.27 : x;
    const cy = atGoal ? y + size * 0.27 : y;
    drawStep(ctx, cx, cy, size, i);
  });
}

function drawStep(c, x, y, s, number) {
  const radius = s * (number > 9 ? 0.27 : 0.24);
  c.fillStyle = "rgba(0, 0, 0, 0.45)";
  c.beginPath();
  c.arc(x + radius * 0.12, y + radius * 0.16, radius, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = COLORS.route;
  c.strokeStyle = COLORS.ink;
  c.lineWidth = Math.max(2, s * 0.035);
  c.beginPath();
  c.arc(x, y, radius, 0, Math.PI * 2);
  c.fill();
  c.stroke();
  c.fillStyle = COLORS.ink;
  c.font = `800 ${Math.round(s * (number > 9 ? 0.27 : 0.31))}px system-ui, sans-serif`;
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillText(number, x, y + 1);
}

function roundRect(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

function drawKey() {
  const pieces = { rover: drawRover, goal: drawGoal, rock: drawRock, step: (c, x, y, s) => drawStep(c, x, y, s, 1) };
  document.querySelectorAll("canvas[data-key]").forEach((keyCanvas) => {
    const c = prepare(keyCanvas, 32, 32);
    c.fillStyle = "#c48a5c";
    c.fillRect(0, 0, 32, 32);
    pieces[keyCanvas.dataset.key](c, 16, 16, 32);
  });
}

// ---------- Driving ----------

function where() {
  return `row ${state.rover[0]}, column ${state.rover[1]}`;
}

function startDriving() {
  heading = "up";
  trail = [state.rover];
}

async function loadMaze(name) {
  state = await api(`/api/state?maze=${encodeURIComponent(name)}`);
  route = null;
  startDriving();
  showMazeTabs();
  draw();
  setStatus("info", `Maze: ${state.maze}`, `Drive the rover to the target. It starts at ${where()}.`);
}

async function move(direction) {
  const result = await api("/api/move", { direction });
  state = result.state;
  route = null;
  heading = direction;
  if (result.ok) trail.push(state.rover);
  draw();
  if (result.reason === "Bounds check not implemented") {
    setStatus("todo", "Bounds check not implemented",
      "is_inside_grid() in rover/grid.py raises NotImplementedError. The rover can't find the map edge.");
  } else if (!result.ok) {
    setStatus("bad", result.reason, `The rover stayed at ${where()}. Try another direction.`);
  } else if (state.at_goal) {
    setStatus("good", `Target reached in ${state.moves_made} moves`, "Press Back to start to drive it again.");
  } else {
    setStatus("info", result.reason, `Now at ${where()}. Moves so far: ${state.moves_made}.`);
  }
}

async function reset() {
  state = await api("/api/reset", { maze: state.maze });
  route = null;
  startDriving();
  draw();
  setStatus("info", "Back at the start", `The rover is at ${where()}. Moves so far: 0.`);
}

function showMazeTabs() {
  mazeTabs.querySelectorAll("button").forEach((tab) => {
    tab.setAttribute("aria-pressed", String(tab.dataset.maze === state.maze));
  });
}

// ---------- Route planning ----------

const batteryInput = document.getElementById("battery");
const batteryTrack = document.getElementById("battery-track");

async function solve() {
  const battery = batteryInput.value.trim();
  const result = await api("/api/solve", battery === "" ? {} : { battery });
  route = result.route || null;
  draw();

  if (result.error && result.charge === undefined && battery !== "") {
    showBattery(null);
    setStatus("bad", result.error, "Type a whole number of battery units, like 6, or leave the box empty.");
  } else if (result.error) {
    showBattery(null);
    setStatus("bad", "No route exists",
      "Rocks wall off the target, so no sequence of up, down, left and right moves can reach it.");
  } else if (result.reachable === undefined) {
    showBattery(null);
    setStatus("good", `Route: ${result.moves} moves`, "Follow the numbered waypoints. The last number is the move count.");
  } else {
    showBattery(result);
    const spare = result.charge - result.moves;
    if (result.reachable) {
      setStatus("good", `Reachable: ${result.moves} moves, battery ${result.charge}`,
        spare === 0
          ? "Exactly enough. One move uses one unit, so the battery will be empty at the target."
          : `One move uses one unit, so ${spare} unit${spare === 1 ? "" : "s"} will be left over.`);
    } else {
      setStatus("bad", `Not reachable: ${result.moves} moves, battery ${result.charge}`,
        `The route needs ${result.moves} units. The battery is ${-spare} short.`);
    }
  }
}

// Power telemetry: one segment per unit. Yellow is spent on the route, white is spare, striped is missing.
function showBattery(result) {
  batteryTrack.hidden = !result;
  if (!result) return;
  const spare = result.charge - result.moves;
  const units = Math.max(result.charge, result.moves);
  let gauge = "";
  if (units <= 60) {
    let segments = "";
    for (let i = 1; i <= units; i++) {
      const kind = i > result.charge ? "short" : i <= result.moves ? "used" : "spare";
      segments += `<span class="seg ${kind}"></span>`;
    }
    gauge = `<div class="gauge${units > 24 ? " dense" : ""}" aria-hidden="true">${segments}</div>`;
  }
  batteryTrack.innerHTML = `${gauge}
    <dl class="readout">
      <div><dt>Needed</dt><dd>${result.moves}</dd></div>
      <div><dt>Battery</dt><dd>${result.charge}</dd></div>
      <div class="${spare < 0 ? "short" : ""}"><dt>${spare < 0 ? "Short" : "Spare"}</dt><dd>${Math.abs(spare)}</dd></div>
    </dl>`;
}

document.getElementById("solve").addEventListener("click", solve);
batteryInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") solve();
});

// ---------- Wiring ----------

const KEYS = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" };

document.addEventListener("keydown", (event) => {
  if (event.target.tagName === "INPUT") return;
  const direction = KEYS[event.key];
  if (direction && state) {
    event.preventDefault();
    move(direction);
  }
});

document.querySelectorAll("[data-direction]").forEach((button) => {
  button.addEventListener("click", () => move(button.dataset.direction));
});

document.getElementById("reset").addEventListener("click", reset);
window.addEventListener("resize", draw);

async function start() {
  const { mazes, default: first } = await api("/api/mazes");
  for (const name of mazes) {
    const tab = document.createElement("button");
    tab.className = "btn tab";
    tab.textContent = name;
    tab.dataset.maze = name;
    tab.addEventListener("click", () => loadMaze(name));
    mazeTabs.append(tab);
  }
  drawKey();
  await loadMaze(first);
}

start().catch(() => {
  setStatus("bad", "Can't reach the rover server", "Start it with python3 -m rover, then refresh this page.");
});
