"""The Mars mazes, drawn as pictures.

S = start   G = goal   # = rock   . = sand   * = the rover starts on the goal
"""

from rover.grid import Grid

MAZES = {
    # Small enough for the class to count the shortest route by eye.
    "tiny": """
        S.#..
        #.#.#
        ....G
        .###.
        .....
    """,
    # 10 x 10: good for "what about row 0, row -1, row 10?"
    "crater": """
        S...#.....
        .##.#.###.
        .#..#...#.
        .#.###.##.
        .#.....#..
        .####.##.#
        ......#...
        .#.####.#.
        .#......#G
        ...##.#...
    """,
    "canyon": """
        S..#......#.....
        .#.#.####.#.###.
        .#...#....#...#.
        .#####.####.#.#.
        .....#......#.#.
        ####.#.######.#.
        .....#........#G
        .#######.######.
    """,
    # The goal is completely surrounded by rocks: there is no route.
    "walled-in": """
        S.....
        .##...
        ......
        ...###
        ...#G#
        ...###
    """,
    # The rover is already sitting on the goal: the route is 0 moves.
    "already-there": """
        .....
        .#.#.
        ..*..
        .#.#.
        .....
    """,
}

DEFAULT_MAZE = "tiny"


def load_maze(name):
    """Return the Grid for a maze name. Raises KeyError for an unknown name."""
    return Grid.from_ascii(MAZES[name])
