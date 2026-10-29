import unittest

from rover.grid import Grid
from rover.rover import Rover

GRID = Grid.from_ascii("""
    S.#
    ...
    ..G
""")


class RoverTests(unittest.TestCase):
    def test_moves_onto_sand(self):
        rover = Rover((0, 0))
        result = rover.move(GRID, "right")
        self.assertTrue(result.ok)
        self.assertEqual(rover.position, (0, 1))
        self.assertEqual(rover.moves_made, 1)

    def test_refuses_to_drive_into_a_rock(self):
        rover = Rover((0, 1))
        result = rover.move(GRID, "right")
        self.assertFalse(result.ok)
        self.assertEqual(result.reason, "Blocked by a rock")
        self.assertEqual(rover.position, (0, 1))
        self.assertEqual(rover.moves_made, 0)

    def test_refuses_to_drive_off_the_edge(self):
        rover = Rover((0, 0))
        for direction in ("up", "left"):
            result = rover.move(GRID, direction)
            self.assertFalse(result.ok)
            self.assertEqual(result.reason, "That's the edge of the map")
        self.assertEqual(rover.position, (0, 0))

    def test_unknown_direction(self):
        rover = Rover((0, 0))
        self.assertFalse(rover.move(GRID, "diagonal").ok)


if __name__ == "__main__":
    unittest.main()
