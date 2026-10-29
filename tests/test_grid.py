import unittest

from rover.grid import Grid, is_inside_grid


class IsInsideGridTests(unittest.TestCase):
    # A 10-row, 10-column grid: rows and columns are numbered 0 to 9.

    def test_corners_are_inside(self):
        self.assertTrue(is_inside_grid(0, 0, 10, 10))
        self.assertTrue(is_inside_grid(9, 9, 10, 10))

    def test_row_minus_one_is_outside(self):
        self.assertFalse(is_inside_grid(-1, 5, 10, 10))

    def test_row_ten_is_outside_a_ten_row_grid(self):
        self.assertFalse(is_inside_grid(10, 5, 10, 10))

    def test_columns_are_checked_too(self):
        self.assertFalse(is_inside_grid(5, -1, 10, 10))
        self.assertFalse(is_inside_grid(5, 10, 10, 10))

    def test_rows_and_columns_can_differ(self):
        self.assertTrue(is_inside_grid(2, 7, 3, 8))
        self.assertFalse(is_inside_grid(3, 7, 3, 8))


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

    def test_neighbors_skip_rocks_and_edges(self):
        self.assertEqual(sorted(self.grid.neighbors((0, 0))), [(0, 1), (1, 0)])
        self.assertEqual(sorted(self.grid.neighbors((1, 0))), [(0, 0), (2, 0)])


if __name__ == "__main__":
    unittest.main()
