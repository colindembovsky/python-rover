"""The rover itself: where it is and how it moves one square at a time."""

from dataclasses import dataclass

from rover.grid import DIRECTIONS, is_inside_grid


@dataclass
class MoveResult:
    ok: bool
    reason: str


class Rover:
    def __init__(self, position):
        self.position = position
        self.moves_made = 0

    def move(self, grid, direction):
        """Try to move one square. The rover refuses to drive off the map or into a rock."""
        if direction not in DIRECTIONS:
            return MoveResult(False, f"Unknown direction: {direction}")

        d_row, d_col = DIRECTIONS[direction]
        row, col = self.position
        target = (row + d_row, col + d_col)

        if not is_inside_grid(target[0], target[1], grid.rows, grid.cols):
            return MoveResult(False, "That's the edge of the map")
        if grid.is_blocked(target):
            return MoveResult(False, "Blocked by a rock")

        self.position = target
        self.moves_made += 1
        return MoveResult(True, f"Moved {direction}")
