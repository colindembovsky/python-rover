import unittest

from rover.grid import Grid


class GridTests(unittest.TestCase):
    def setUp(self):
        self.grid = Grid.from_ascii("""
            S.#
            .#.
            ..G
        """)

    def test_from_ascii_reads_the_picture(self):
        self.assertEqual((self.grid.rows, self.grid.cols), (3, 3))
        self.assertEqual(self.grid.start, (0, 0))
        self.assertEqual(self.grid.goal, (2, 2))
        self.assertEqual(self.grid.rocks, frozenset({(0, 2), (1, 1)}))

    def test_star_means_start_on_goal(self):
        grid = Grid.from_ascii("..\n.*")
        self.assertEqual(grid.start, grid.goal)


if __name__ == "__main__":
    unittest.main()
