# Copy/paste prompts

Paste these into Copilot agent mode (or Copilot CLI) from the repository root. Every prompt is bounded: it names the files, the rules and the tests, and it forbids new dependencies.

## Demo 1: bounds check

**Start from:** `checkpoint/0-starter`

```
Implement is_inside_grid(row, col, rows, cols) in rover/grid.py. It must return True
when (row, col) is a square on a grid with `rows` rows and `cols` columns, and False
otherwise. Rows and columns are numbered from 0. Replace the NotImplementedError.
Add unit tests to tests/test_grid.py for: the corners (0, 0) and (rows-1, cols-1),
row -1, row equal to rows (for example row 10 on a 10-row grid), and the same edge
cases for columns. Also add a test that Grid.neighbors() skips rocks and edges.
Then remove the @unittest.skip line from tests/test_rover.py and run
python3 -m unittest. Keep it simple and readable. Do not add dependencies.
```

## Demo 2: Solve (route planning)

**Start from:** `checkpoint/1-manual`

```
Add automatic route planning to this Python rover app. Read the existing code first
(rover/grid.py, rover/rover.py, rover/server.py, web/app.js, web/index.html).
Keep the current interface and manual controls.

Requirements:
- Add a Solve action that finds a shortest route from the rover's current square to
  the goal. Put the route-finding logic in a new module rover/planner.py with
  find_route(grid, start=None) returning a Route(cells, moves), or None if there is
  no route.
- The rover may move up, down, left, or right, but not diagonally. It must never cross
  an obstacle. Use Grid.neighbors().
- Add POST /api/solve to rover/server.py returning {"route": [[row, col], ...],
  "moves": n}, or {"error": "No route exists"}.
- Add a Solve button to web/index.html. In web/app.js, display the route on the map
  with numbered steps, and show its number of moves in the status bar
  (for example "Route: 6 moves").
- If no route exists, show a clear message without crashing.
- Keep the route-finding logic separate from the drawing code.
- Use a straightforward algorithm, not a machine-learning model.
- Add and run tests in tests/test_planner.py for a simple route, an unreachable goal
  (the walled-in maze), and a start position that is already the goal
  (the already-there maze). Run python3 -m unittest.
- Do not add dependencies.
```

## Demo 3: battery budget

**Start from:** `checkpoint/2-solver`. **Fill in the blank live with the class.**

```
Add a battery budget to the Solve feature. Read the existing code first.

Rules:
- One move uses one unit of battery charge.
- Acceptance criterion: when the battery charge is exactly equal to the number of
  moves in the route, the rover ____________________ reach the goal.

Requirements:
- Put the rule in a new module rover/battery.py with a function
  can_reach(route, charge), separate from the drawing and server code.
- Add a "Battery" number input next to the Solve button in web/index.html.
- POST /api/solve accepts an optional {"battery": n}. When it is given, also return
  {"reachable": true/false, "charge": n}. Reject negative or non-number charges with a
  clear error.
- Show the result in the status bar, for example
  "Route: 6 moves. Battery 6: reachable" or "... NOT reachable".
- Add and run tests in tests/test_battery.py for plenty of charge, exactly enough
  charge, and one unit short. Run python3 -m unittest.
- Do not add dependencies.
```

## Prepared bug: fix and add the missing test

**Start from:** `checkpoint/4-bug`

```
On the tiny maze, Solve reports "Route: 7 moves" but the numbered steps on the map
end at 6. Find the bug in rover/planner.py and fix it. A route's moves is the number
of steps between squares, not the number of squares. Then add a test to
tests/test_planner.py that would have caught this bug (for example the grid "S..G":
4 squares, 3 moves) and run python3 -m unittest.
```
