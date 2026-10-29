"""Battery budget: one move uses one unit of charge."""


def can_reach(route, charge):
    """Return True if the rover has enough charge to drive the whole route.

    Exactly enough charge counts as enough.
    """
    return route.moves <= charge
