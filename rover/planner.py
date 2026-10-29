"""Route planning with breadth-first search (BFS).

This is ordinary code, not machine learning. BFS explores the grid in rings:
first every square 1 move away, then every square 2 moves away, and so on.
The first time it reaches the goal, it has found a shortest route.
"""

from collections import deque
from dataclasses import dataclass


@dataclass(frozen=True)
class Route:
    cells: tuple  # every square on the route, including the start and the goal
    moves: int    # number of steps between squares


def find_route(grid, start=None):
    """Return a shortest Route from `start` (default: the grid's start) to the goal, or None."""
    if start is None:
        start = grid.start

    came_from = {start: None}  # each square we've reached -> the square we came from
    queue = deque([start])

    while queue:
        cell = queue.popleft()
        if cell == grid.goal:
            return _build_route(came_from, cell)
        for next_cell in grid.neighbors(cell):
            if next_cell not in came_from:
                came_from[next_cell] = cell
                queue.append(next_cell)

    return None


def _build_route(came_from, goal):
    """Walk backwards from the goal to the start, then flip the list around."""
    cells = []
    cell = goal
    while cell is not None:
        cells.append(cell)
        cell = came_from[cell]
    cells.reverse()
    return Route(cells=tuple(cells), moves=len(cells) - 1)
