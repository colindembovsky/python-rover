"""Start Mission Control: python -m rover [--port 8000] [--no-browser]"""

import argparse
import threading
import webbrowser

from rover.server import make_server


def main():
    parser = argparse.ArgumentParser(description="Mars Rover Mission Control")
    parser.add_argument("--port", type=int, default=8000, help="port to listen on (default 8000)")
    parser.add_argument("--no-browser", action="store_true", help="don't open a browser window")
    args = parser.parse_args()

    server = make_server(args.port)
    url = f"http://localhost:{args.port}/"
    print(f"Mission Control is running at {url}  (press Ctrl+C to stop)")
    if not args.no_browser:
        threading.Timer(0.5, webbrowser.open, args=[url]).start()

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nMission Control signing off.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
