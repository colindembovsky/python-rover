# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
The primary user is a presenter running a 45-minute classroom session, projected on a screen, for high-school students who are new to Python. The students are "mission control": they watch, predict edge cases, count routes and challenge the software. They don't operate the app themselves. Secondary users are students who clone the repo afterwards and run it on their own laptops.

## Product Purpose
Mars Rover Mission Control is a tiny rover that drives through a grid of rocks to a goal. It exists to answer one question live: "If AI can write the code, what is the engineer's job?" The presenter drives by hand, delegates route planning to Copilot, adds a battery-budget rule from the class, and exposes a prepared off-by-one bug. A session succeeds when students can tell that the rover runs ordinary code (BFS) and that the deep learning was in the coding assistant, and when they can explain why tests alone aren't proof.

## Positioning
This is a teaching prop, not a game. Every visual state maps to a talking point. Those points are: bounds not implemented, blocked by a rock, edge of the map, a route with a numbered move count, no route exists, and reachable or not reachable on a given battery. The UI has to make each state unmistakable from the back of a classroom.

## Operating Context
- The app runs on a presenter's laptop and is mirrored to a projector, at about 1280×720 or a laptop screen.
- The presenter switches git checkpoints and restarts the server mid-talk. The UI only shows the controls that exist at each checkpoint.
- The presenter drives with the arrow keys or on-screen arrow buttons, then uses a Solve button and a battery number input.
- School Wi-Fi may be unreliable, so everything must work offline.

## Capabilities and Constraints
- The backend uses the Python standard library only (http.server and unittest).
- The frontend is plain HTML/CSS/JS with a single canvas. There are no frameworks, CDNs or runtime-fetched fonts, so it uses system font stacks.
- Grid cells are (row, col), and moves are up, down, left and right with no diagonals. A route's move count is one less than its number of squares.
- The mazes are tiny (5×5), crater (10×10), canyon (8×16), walled-in (no route) and already-there (0 moves).

## Brand Commitments
- The name is "Mars Rover Mission Control".
- The voice is plain, friendly and literal, for example "Blocked by a rock" and "That's the edge of the map".

## Evidence on Hand
There are no logos, images or brand assets. All visuals are drawn in code.

## Product Principles
1. The UI must be legible from the back of the room, with big type and strong contrast.
2. Every state must be unmistakable, and must not rely on colour alone.
3. The UI shows only what exists at the current checkpoint, and logic stays in Python.
4. The UI must be honest. It never hides or smooths over what the code actually reported, because the bug demo depends on that.

## Accessibility & Inclusion
The app is projected for a mixed classroom, so it needs high contrast. Colour-blind students must be able to tell rover, rock, goal, route and the good/bad states apart by shape and text as well as colour. It must also be operable from the keyboard.
