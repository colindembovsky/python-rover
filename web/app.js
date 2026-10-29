// Mission Control page. This file only draws the board and talks to the Python server.
// All the rover rules live in Python (the rover/ package).

const canvas = document.getElementById("map");
const ctx = canvas.getContext("2d");
const boardWrap = document.getElementById("board-wrap");
const statusCard = document.getElementById("status");
const statusTitle = document.getElementById("status-title");
const statusDetail = document.getElementById("status-detail");
const mazeTabs = document.getElementById("maze-tabs");

const COLORS = {
  frame: "#2e211b",
  gap: "#1d1612",
  sand: ["#dc9053", "#d3854a"],
  sandEdgeLight: "rgba(255, 236, 205, 0.35)",
  sandEdgeDark: "rgba(60, 25, 5, 0.30)",
  coordinate: "#f6eddc",
  rock: "#3d3431",
  rockLight: "#5e524c",
  rockEdge: "#120d0b",
  cream: "#f6eddc",
  ink: "#1d1612",
  navy: "#1f3b73",
  goalBase: "#2f7d4f",
  shadow: "rgba(0, 0, 0, 0.38)",
};

let state = null; // what the server says about the maze and the rover
let route = null; // the planned route, as a list of [row, col]

async function api(path, body) {
  const options = body === undefined
    ? {}
    : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
  const response = await fetch(path, options);
  return response.json();
}

// ---------- Status card ----------

// kind is "info", "good", "bad" or "todo". Each has its own icon shape, so colour is never the only clue.
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

// ---------- Drawing ----------

let size = 60; // pixels per square
let margin = 34; // room for the printed row and column numbers

function layout() {
  const top = boardWrap.getBoundingClientRect().top + window.scrollY;
  const keyHeight = 56;
  const roomWide = boardWrap.clientWidth;
  const roomHigh = Math.max(260, window.innerHeight - top - keyHeight - 16);
  const fit = Math.min(roomWide / (state.cols + 0.9), roomHigh / (state.rows + 0.9));
  size = Math.floor(Math.max(22, Math.min(88, fit)));
  margin = Math.round(Math.max(24, size * 0.55));
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

  drawBoard(width, height);
  for (const [row, col] of state.rocks) drawRock(ctx, ...center(row, col), size);
  drawStart(...center(...state.start));
  drawGoal(ctx, ...center(...state.goal), size);
  if (route) drawRoute();
  drawRover(ctx, ...center(...state.rover), size);
}

function drawBoard(width, height) {
  ctx.fillStyle = COLORS.frame;
  roundRect(ctx, 0, 0, width, height, 14);
  ctx.fill();

  // Printed coordinates on the frame, on all four sides.
  ctx.fillStyle = COLORS.coordinate;
  ctx.font = `700 ${Math.round(Math.min(20, margin * 0.6))}px system-ui, sans-serif`;
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

  ctx.fillStyle = COLORS.gap;
  ctx.fillRect(margin - 2, margin - 2, state.cols * size + 4, state.rows * size + 4);

  // Sand tiles with a slight printed bevel.
  const gap = Math.max(1, Math.round(size * 0.03));
  for (let row = 0; row < state.rows; row++) {
    for (let col = 0; col < state.cols; col++) {
      const x = margin + col * size + gap;
      const y = margin + row * size + gap;
      const s = size - gap * 2;
      ctx.fillStyle = COLORS.sand[(row + col) % 2];
      ctx.fillRect(x, y, s, s);
      ctx.fillStyle = COLORS.sandEdgeLight;
      ctx.fillRect(x, y, s, 2);
      ctx.fillRect(x, y, 2, s);
      ctx.fillStyle = COLORS.sandEdgeDark;
      ctx.fillRect(x, y + s - 2, s, 2);
      ctx.fillRect(x + s - 2, y, 2, s);
    }
  }
}

function drawStart(x, y) {
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = Math.max(2, size * 0.04);
  ctx.setLineDash([size * 0.08, size * 0.06]);
  ctx.beginPath();
  ctx.arc(x, y, size * 0.4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
}

// Rocks: a raised basalt boulder with a hatched face and a cast shadow.
function drawRock(c, x, y, s) {
  const points = [
    [-0.36, 0.1], [-0.3, -0.2], [-0.08, -0.36], [0.2, -0.32], [0.38, -0.08], [0.34, 0.24], [0.08, 0.36], [-0.24, 0.32],
  ];
  const path = () => {
    c.beginPath();
    points.forEach(([px, py], i) => (i ? c.lineTo(x + px * s, y + py * s) : c.moveTo(x + px * s, y + py * s)));
    c.closePath();
  };

  c.save();
  c.translate(s * 0.06, s * 0.08);
  c.fillStyle = COLORS.shadow;
  path();
  c.fill();
  c.restore();

  c.fillStyle = COLORS.rock;
  path();
  c.fill();

  c.save();
  path();
  c.clip();
  c.strokeStyle = COLORS.rockLight;
  c.lineWidth = Math.max(1.5, s * 0.035);
  for (let d = -s; d < s; d += s * 0.14) {
    c.beginPath();
    c.moveTo(x + d, y - s / 2);
    c.lineTo(x + d + s, y + s / 2);
    c.stroke();
  }
  c.restore();

  c.strokeStyle = COLORS.rockEdge;
  c.lineWidth = Math.max(2, s * 0.05);
  c.lineJoin = "round";
  path();
  c.stroke();
}

// Goal: a green base token with a black-and-white chequered flag.
function drawGoal(c, x, y, s) {
  token(c, x, y, s * 0.4, COLORS.goalBase, COLORS.cream);
  const poleX = x - s * 0.17;
  c.strokeStyle = COLORS.cream;
  c.lineWidth = Math.max(2, s * 0.05);
  c.lineCap = "round";
  c.beginPath();
  c.moveTo(poleX, y + s * 0.26);
  c.lineTo(poleX, y - s * 0.28);
  c.stroke();

  const flagW = s * 0.36;
  const flagH = s * 0.24;
  const cell = flagW / 4;
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 3; j++) {
      c.fillStyle = (i + j) % 2 === 0 ? COLORS.ink : COLORS.cream;
      c.fillRect(poleX + i * cell, y - s * 0.28 + j * (flagH / 3), cell, flagH / 3);
    }
  }
  c.strokeStyle = COLORS.ink;
  c.lineWidth = 1.5;
  c.strokeRect(poleX, y - s * 0.28, flagW, flagH);
}

// Rover: a cream token with a navy rim and a little six-wheeled rover printed on it.
function drawRover(c, x, y, s) {
  token(c, x, y, s * 0.42, COLORS.cream, COLORS.navy, Math.max(3, s * 0.07));
  c.fillStyle = COLORS.navy;
  const w = s * 0.42;
  const h = s * 0.16;
  for (const dx of [-w / 2.6, 0, w / 2.6]) {
    c.beginPath();
    c.arc(x + dx, y + s * 0.12, s * 0.065, 0, Math.PI * 2);
    c.fill();
  }
  roundRect(c, x - w / 2, y - h / 2 - s * 0.02, w, h, s * 0.04);
  c.fill();
  c.fillRect(x + w * 0.12, y - s * 0.24, s * 0.05, s * 0.16);
  c.beginPath();
  c.arc(x + w * 0.12 + s * 0.025, y - s * 0.25, s * 0.06, 0, Math.PI * 2);
  c.fill();
}

// Route: navy move counters numbered 1, 2, 3... so the last number is the number of moves.
function drawRoute() {
  ctx.strokeStyle = COLORS.navy;
  ctx.lineWidth = Math.max(3, size * 0.08);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.setLineDash([size * 0.12, size * 0.1]);
  ctx.beginPath();
  route.forEach(([row, col], i) => {
    const [x, y] = center(row, col);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.setLineDash([]);

  route.forEach(([row, col], i) => {
    if (i === 0) return;
    const [x, y] = center(row, col);
    const atGoal = row === state.goal[0] && col === state.goal[1];
    // On the goal square, the counter sits in the corner so the flag stays visible.
    const cx = atGoal ? x + size * 0.26 : x;
    const cy = atGoal ? y + size * 0.26 : y;
    drawStep(ctx, cx, cy, size, i);
  });
}

function drawStep(c, x, y, s, number) {
  const radius = s * (number > 9 ? 0.27 : 0.24);
  token(c, x, y, radius, COLORS.navy, COLORS.cream, Math.max(2, s * 0.04));
  c.fillStyle = COLORS.cream;
  c.font = `800 ${Math.round(s * (number > 9 ? 0.26 : 0.3))}px system-ui, sans-serif`;
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillText(number, x, y + 1);
}

function token(c, x, y, radius, fill, rim, rimWidth = 2) {
  c.fillStyle = COLORS.shadow;
  c.beginPath();
  c.arc(x + radius * 0.12, y + radius * 0.18, radius, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = fill;
  c.strokeStyle = rim;
  c.lineWidth = rimWidth;
  c.beginPath();
  c.arc(x, y, radius, 0, Math.PI * 2);
  c.fill();
  c.stroke();
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
    const c = prepare(keyCanvas, 30, 30);
    pieces[keyCanvas.dataset.key](c, 15, 15, 30);
  });
}

// ---------- Driving ----------

function where() {
  return `row ${state.rover[0]}, column ${state.rover[1]}`;
}

async function loadMaze(name) {
  state = await api(`/api/state?maze=${encodeURIComponent(name)}`);
  route = null;
  showMazeTabs();
  draw();
  setStatus("info", `Maze: ${state.maze}`, `Drive the rover to the flag. It starts at ${where()}.`);
}

async function move(direction) {
  const result = await api("/api/move", { direction });
  state = result.state;
  route = null;
  draw();
  if (result.reason === "Bounds check not implemented") {
    setStatus("todo", "Bounds check not implemented",
      "is_inside_grid() in rover/grid.py raises NotImplementedError. The rover can't find the map edge.");
  } else if (!result.ok) {
    setStatus("bad", result.reason, `The rover stayed at ${where()}. Try another direction.`);
  } else if (state.at_goal) {
    setStatus("good", `Goal reached in ${state.moves_made} moves`, "Press Back to start to drive it again.");
  } else {
    setStatus("info", result.reason, `Now at ${where()}. Moves so far: ${state.moves_made}.`);
  }
}

async function reset() {
  state = await api("/api/reset", { maze: state.maze });
  route = null;
  draw();
  setStatus("info", "Back at the start", `The rover is at ${where()}. Moves so far: 0.`);
}

function showMazeTabs() {
  mazeTabs.querySelectorAll("button").forEach((tab) => {
    tab.setAttribute("aria-pressed", String(tab.dataset.maze === state.maze));
  });
}

// ---------- Route planning ----------

async function solve() {
  const result = await api("/api/solve", {});
  route = result.route || null;
  draw();
  if (result.error) {
    setStatus("bad", "No route exists",
      "Rocks wall off the flag, so no sequence of up, down, left and right moves can reach it.");
  } else {
    setStatus("good", `Route: ${result.moves} moves`, "Follow the numbered counters. The last number is the move count.");
  }
}

document.getElementById("solve").addEventListener("click", solve);

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
    tab.className = "card tab";
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
