"""A small web server for Mission Control.

It serves the web page in web/ and a JSON API that the page calls:

    GET  /api/mazes              -> list of maze names
    GET  /api/state?maze=NAME    -> the grid and the rover (switches maze if NAME is given)
    POST /api/move  {direction}  -> try to move the rover one square
    POST /api/reset {maze}       -> put the rover back on the start square
    POST /api/solve              -> shortest route from the rover to the goal

Only the Python standard library is used.
"""

import json
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from rover.mazes import DEFAULT_MAZE, MAZES, load_maze
from rover.planner import find_route
from rover.rover import Rover

WEB_DIR = Path(__file__).resolve().parent.parent / "web"


class MissionControl:
    """Holds the current maze and rover. All the game logic lives in the rover package, not here."""

    def __init__(self, maze_name=DEFAULT_MAZE):
        self.lock = threading.Lock()
        self.reset(maze_name)

    def reset(self, maze_name=None):
        if maze_name is not None:
            if maze_name not in MAZES:
                raise KeyError(maze_name)
            self.maze_name = maze_name
        self.grid = load_maze(self.maze_name)
        self.rover = Rover(self.grid.start)

    def state(self):
        grid = self.grid
        return {
            "maze": self.maze_name,
            "rows": grid.rows,
            "cols": grid.cols,
            "rocks": sorted(list(cell) for cell in grid.rocks),
            "start": list(grid.start),
            "goal": list(grid.goal),
            "rover": list(self.rover.position),
            "moves_made": self.rover.moves_made,
            "at_goal": self.rover.position == grid.goal,
        }

    def move(self, direction):
        try:
            result = self.rover.move(self.grid, direction)
        except NotImplementedError:
            return {"ok": False, "reason": "Bounds check not implemented", "state": self.state()}
        return {"ok": result.ok, "reason": result.reason, "state": self.state()}

    def solve(self):
        route = find_route(self.grid, self.rover.position)
        if route is None:
            return {"error": "No route exists"}
        return {"route": [list(cell) for cell in route.cells], "moves": route.moves}


class BadRequest(Exception):
    pass


class RoverHandler(SimpleHTTPRequestHandler):
    mission = None  # set by make_server()

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(WEB_DIR), **kwargs)

    def do_GET(self):
        url = urlparse(self.path)
        if not url.path.startswith("/api/"):
            return super().do_GET()

        mission = self.mission
        with mission.lock:
            if url.path == "/api/mazes":
                return self.send_json({"mazes": list(MAZES), "default": DEFAULT_MAZE})
            if url.path == "/api/state":
                maze = parse_qs(url.query).get("maze", [None])[0]
                if maze is not None and maze != mission.maze_name:
                    if maze not in MAZES:
                        return self.send_json({"error": f"Unknown maze: {maze}"}, 404)
                    mission.reset(maze)
                return self.send_json(mission.state())
        self.send_json({"error": "Not found"}, 404)

    def do_POST(self):
        url = urlparse(self.path)
        try:
            body = self.read_json()
        except BadRequest as error:
            return self.send_json({"error": str(error)}, 400)

        mission = self.mission
        with mission.lock:
            try:
                if url.path == "/api/move":
                    return self.send_json(mission.move(body.get("direction")))
                if url.path == "/api/reset":
                    maze = body.get("maze")
                    if maze is not None and maze not in MAZES:
                        return self.send_json({"error": f"Unknown maze: {maze}"}, 404)
                    mission.reset(maze)
                    return self.send_json(mission.state())
                if url.path == "/api/solve":
                    return self.send_json(mission.solve())
            except BadRequest as error:
                return self.send_json({"error": str(error)}, 400)
        self.send_json({"error": "Not found"}, 404)

    def read_json(self):
        length = int(self.headers.get("Content-Length") or 0)
        if length == 0:
            return {}
        try:
            body = json.loads(self.rfile.read(length))
        except json.JSONDecodeError:
            raise BadRequest("Body must be JSON")
        if not isinstance(body, dict):
            raise BadRequest("Body must be a JSON object")
        return body

    def send_json(self, data, status=200):
        payload = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(payload)

    def end_headers(self):
        # Always serve fresh files, so switching git checkpoints shows up on a plain refresh.
        if not self.path.startswith("/api/"):
            self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, format, *args):
        pass  # keep the terminal quiet during the demo


def make_server(port=8000, host="127.0.0.1"):
    RoverHandler.mission = MissionControl()
    return ThreadingHTTPServer((host, port), RoverHandler)
