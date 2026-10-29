# Mars Rover Mission Control

This is a small Python app for a classroom session about one question: **"If AI can write the code, what is the engineer's job?"**

A rover sits on an orbital map of the Martian surface, divided into a grid, and has to reach a target crosshair without driving into boulders. You start by driving it by hand. Then you use GitHub Copilot, live, to add route planning, and finally you respond to a new requirement from the class: a battery budget.

> The route-finding algorithm is ordinary code (breadth-first search). The deep learning is in the coding assistant that helped write it, not in the rover.

## Run it

You need Python 3.9 or newer. There's nothing to install, because the app uses only the standard library.

```bash
python3 -m rover               # opens http://localhost:8000 in your browser
python3 -m rover --port 8080   # use a different port
python3 -m rover --no-browser  # don't open a browser window
python3 -m unittest            # run the tests
```

Drive with the arrow buttons or the arrow keys. Use the **Maze** menu to switch maps.

## How it fits together

This section and the API table describe the finished app (`checkpoint/3-battery`). Earlier checkpoints deliberately leave out the planner, the battery check and `/api/solve`, because you add them live.

```
rover/grid.py      Grid, is_inside_grid(), neighbors(): the map and its rules
rover/mazes.py     The mazes, drawn as ASCII pictures (S start, G goal, # rock, . sand, * start on goal)
rover/rover.py     Rover.move(): one square at a time, refusing rocks and edges
rover/planner.py   find_route(): breadth-first search for a shortest route
rover/battery.py   can_reach(): one move costs one unit of charge
rover/server.py    Serves web/ and a small JSON API
web/               index.html, style.css and app.js: drawing only, with no game rules
tests/             unittest tests
docs/              Demo script, copy/paste prompts and presenter checklist
```

| API | What it does |
|---|---|
| `GET /api/mazes` | Lists the maze names |
| `GET /api/state?maze=tiny` | Returns the grid, rocks, start, goal and rover (and switches maze) |
| `POST /api/move` `{"direction": "up"}` | Tries to move one square |
| `POST /api/reset` `{"maze": "tiny"}` | Puts the rover back on the start square |
| `POST /api/solve` `{"battery": 6}` | Returns `{route, moves}` (plus `reachable` and `charge` when a battery is given), or `{"error": "No route exists"}` |

## Mazes

| Maze | Why it's there |
|---|---|
| `tiny` | 5 × 5, so the class can count the shortest route by eye (6 moves) |
| `crater` | 10 × 10, for the question "what about row 0, row −1, row 10?" |
| `canyon` | A long, winding route |
| `walled-in` | The goal is surrounded by rocks, so no route exists |
| `already-there` | The rover starts on the goal, so the route is 0 moves |

## Demo checkpoints

Each checkpoint is a branch, and each branch has a matching tag (`demo-0-starter` … `demo-4-bug`) that marks the same commit. The tag names differ from the branch names so that `git switch` is never ambiguous. Switch with `git switch <branch>`, then **restart** `python3 -m rover`, because the server loads the Python code when it starts.

| Checkpoint branch | Tag | State | Used for |
|---|---|---|---|
| `checkpoint/0-starter` (also `main`) | `demo-0-starter` | The UI, mazes and manual-driving wiring work, but `is_inside_grid` raises `NotImplementedError` and the UI shows "Bounds check not implemented". There's no Solve button. | Demo 1 starting point |
| `checkpoint/1-manual` | `demo-1-manual` | `is_inside_grid` and its tests are done, and manual driving fully works | Demo 2 starting point |
| `checkpoint/2-solver` | `demo-2-solver` | Solve button, BFS planner, numbered route overlay, move count and the "No route exists" message, plus planner tests | Demo 3 starting point / Demo 2 fallback |
| `checkpoint/3-battery` | `demo-3-battery` | Battery input with a reachable / NOT reachable report, plus battery tests | Demo 3 fallback |
| `checkpoint/4-bug` | `demo-4-bug` | `3-battery` plus a deliberate bug: the planner counts squares instead of moves, and the test that would catch it has been weakened | The "trust" discussion |

If a live demo goes wrong, `git switch -f checkpoint/2-solver` throws away your edits and jumps to the prepared state.

See [docs/demo-script.md](docs/demo-script.md), [docs/prompts.md](docs/prompts.md) and [docs/presenter-checklist.md](docs/presenter-checklist.md).
