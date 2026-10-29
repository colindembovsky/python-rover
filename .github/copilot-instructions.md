# Copilot instructions for python-rover

This is a teaching app for high-school Python students. Keep it small and readable.

- **Standard library only.** Do not add dependencies, `requirements.txt` entries or CDN scripts. The server uses `http.server`; tests use `unittest`.
- **Keep the rules separate from the UI.** Grid, rover, route-planning and battery logic belong in the `rover/` package as plain Python functions and classes. `rover/server.py` only turns them into JSON. `web/` only draws and sends requests. It must not contain any game rules.
- **Plain algorithms, not machine learning.** Route planning is ordinary code, such as breadth-first search.
- **Cells are `(row, col)`.** Row 0 is the top row, and moves are up, down, left and right (no diagonals). A route's `moves` is the number of steps, which is one less than the number of squares.
- **Tests:** add or update tests in `tests/` for every behaviour change, then run `python3 -m unittest` from the repository root. All tests must pass.
- **Readable code:** use short functions, clear names, and a docstring on each public function. Avoid clever one-liners.
- The UI is shown on a projector, so keep text large and high-contrast.
