import unittest

from rover.grid import Grid
from rover.mazes import load_maze
from rover.planner import find_route


class PlannerTests(unittest.TestCase):
    def test_simple_route(self):
        grid = Grid.from_ascii("""
            S..
            ##.
            ..G
        """)
        route = find_route(grid)
        self.assertEqual(route.cells, ((0, 0), (0, 1), (0, 2), (1, 2), (2, 2)))

    def test_route_goes_around_rocks_without_diagonals(self):
        route = find_route(load_maze("tiny"))
        self.assertEqual(len(route.cells), 7)
        for (r1, c1), (r2, c2) in zip(route.cells, route.cells[1:]):
            self.assertEqual(abs(r1 - r2) + abs(c1 - c2), 1)
        grid = load_maze("tiny")
        self.assertFalse(any(grid.is_blocked(cell) for cell in route.cells))

    def test_unreachable_goal(self):
        self.assertIsNone(find_route(load_maze("walled-in")))

    def test_start_is_already_the_goal(self):
        grid = load_maze("already-there")
        route = find_route(grid)
        self.assertEqual(route.cells, (grid.goal,))

    def test_can_start_from_a_different_square(self):
        grid = Grid.from_ascii("S..G")
        route = find_route(grid, start=(0, 2))
        self.assertEqual(route.cells, ((0, 2), (0, 3)))


if __name__ == "__main__":
    unittest.main()
