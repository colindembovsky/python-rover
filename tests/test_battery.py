import unittest

from rover.battery import can_reach
from rover.planner import Route
from rover.server import BadRequest, parse_battery

SIX_MOVES = Route(cells=tuple((0, col) for col in range(7)), moves=6)


class BatteryTests(unittest.TestCase):
    def test_plenty_of_charge(self):
        self.assertTrue(can_reach(SIX_MOVES, 10))

    def test_exactly_enough_is_enough(self):
        self.assertTrue(can_reach(SIX_MOVES, 6))

    def test_one_unit_short(self):
        self.assertFalse(can_reach(SIX_MOVES, 5))

    def test_zero_moves_needs_zero_charge(self):
        self.assertTrue(can_reach(Route(cells=((0, 0),), moves=0), 0))


class ParseBatteryTests(unittest.TestCase):
    def test_blank_means_no_battery(self):
        self.assertIsNone(parse_battery(None))
        self.assertIsNone(parse_battery(""))

    def test_whole_numbers_and_number_strings(self):
        self.assertEqual(parse_battery(6), 6)
        self.assertEqual(parse_battery("6"), 6)

    def test_rejects_bad_charges(self):
        for bad in (-1, "-1", 6.5, "six", True):
            with self.assertRaises(BadRequest):
                parse_battery(bad)


if __name__ == "__main__":
    unittest.main()
