"""The Mars grid: how big it is, where the rocks are, and where the rover starts and finishes.

Cells are written as (row, col). Row 0 is the top row and col 0 is the left column.
"""

from dataclasses import dataclass

# How each direction changes (row, col).
DIRECTIONS = {
    "up": (-1, 0),
    "down": (1, 0),
    "left": (0, -1),
    "right": (0, 1),
}


def is_inside_grid(row, col, rows, cols):
    """Return True if (row, col) is a square on a grid with `rows` rows and `cols` columns."""
    # Demo 1: ask Copilot to write this, then check its answer for row 0, row -1 and row 10.
    raise NotImplementedError("Bounds check not implemented")


@dataclass(frozen=True)
class Grid:
    rows: int
    cols: int
    rocks: frozenset
    start: tuple
    goal: tuple

    @classmethod
    def from_ascii(cls, text):
        """Build a Grid from a picture made of characters.

        S = start, G = goal, # = rock, . = sand,
        * = the rover starts on the goal square.
        """
        lines = [line.strip() for line in text.strip().splitlines() if line.strip()]
        rocks = set()
        start = goal = None
        for row, line in enumerate(lines):
            if len(line) != len(lines[0]):
                raise ValueError(f"Row {row} has a different length from row 0")
            for col, char in enumerate(line):
                if char == "#":
                    rocks.add((row, col))
                elif char == "S":
                    start = (row, col)
                elif char == "G":
                    goal = (row, col)
                elif char == "*":
                    start = goal = (row, col)
                elif char != ".":
                    raise ValueError(f"Unknown map character {char!r} at ({row}, {col})")
        if start is None or goal is None:
            raise ValueError("A maze needs a start (S) and a goal (G)")
        return cls(len(lines), len(lines[0]), frozenset(rocks), start, goal)

    def is_blocked(self, cell):
        """Return True if there is a rock on this cell."""
        return cell in self.rocks

    def neighbors(self, cell):
        """Return the cells the rover can step to from `cell`: no diagonals, no rocks, no edges."""
        row, col = cell
        result = []
        for d_row, d_col in DIRECTIONS.values():
            next_row, next_col = row + d_row, col + d_col
            if not is_inside_grid(next_row, next_col, self.rows, self.cols):
                continue
            if self.is_blocked((next_row, next_col)):
                continue
            result.append((next_row, next_col))
        return result
