"""
Birthday Website — local preview server
---------------------------------------
Run:
    python3 server.py

Open on this computer:  http://localhost:8000
Open on a phone:        http://<your-lan-ip>:8000   (same Wi-Fi)

The server only exposes index.html, robots.txt and /assets/.
The private originals and design references are never served.
No third-party packages required.
"""

from __future__ import annotations

import mimetypes
import os
import posixpath
import socket
import sys
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import unquote, urlparse

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ASSETS_DIR = os.path.join(BASE_DIR, "assets")
START_PORT = 8000

mimetypes.add_type("font/woff2", ".woff2")
mimetypes.add_type("image/jpeg", ".jpg")
mimetypes.add_type("image/svg+xml", ".svg")
mimetypes.add_type("text/javascript", ".js")
mimetypes.add_type("text/css", ".css")


def lan_ip() -> str:
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock.connect(("8.8.8.8", 80))
        ip = sock.getsockname()[0]
        sock.close()
        return ip
    except OSError:
        return "127.0.0.1"


class PreviewHandler(BaseHTTPRequestHandler):
    server_version = "AnushkaPreview/1.0"

    def log_message(self, fmt: str, *args) -> None:  # quieter, still useful
        sys.stderr.write("  %s\n" % (fmt % args))

    def do_HEAD(self) -> None:
        self.serve(send_body=False)

    def do_GET(self) -> None:
        self.serve(send_body=True)

    def serve(self, send_body: bool) -> None:
        path = unquote(urlparse(self.path).path)

        if path == "/robots.txt":
            body = b"User-agent: *\nDisallow: /\n"
            self.send_response(HTTPStatus.OK)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            if send_body:
                self.wfile.write(body)
            return

        if path in ("/", "/index.html"):
            file_path = os.path.join(BASE_DIR, "index.html")
        elif path == "/favicon.ico":
            self.send_response(HTTPStatus.NO_CONTENT)
            self.end_headers()
            return
        elif path.startswith("/assets/"):
            rel = posixpath.normpath(path.lstrip("/"))
            file_path = os.path.join(BASE_DIR, *rel.split("/"))
            if not os.path.realpath(file_path).startswith(os.path.realpath(ASSETS_DIR) + os.sep):
                self.not_found()
                return
        else:
            self.not_found()
            return

        if not os.path.isfile(file_path):
            self.not_found()
            return

        ctype, _ = mimetypes.guess_type(file_path)
        ctype = ctype or "application/octet-stream"
        if ctype.startswith("text/") or ctype in ("text/javascript", "image/svg+xml"):
            ctype += "; charset=utf-8"

        try:
            size = os.path.getsize(file_path)
            with open(file_path, "rb") as handle:
                self.send_response(HTTPStatus.OK)
                self.send_header("Content-Type", ctype)
                self.send_header("Content-Length", str(size))
                self.send_header("Cache-Control", "no-store, max-age=0")
                self.send_header("X-Content-Type-Options", "nosniff")
                self.send_header("Referrer-Policy", "no-referrer")
                self.send_header("X-Frame-Options", "DENY")
                self.end_headers()
                if send_body:
                    while chunk := handle.read(64 * 1024):
                        self.wfile.write(chunk)
        except (BrokenPipeError, ConnectionResetError):
            pass
        except OSError:
            self.not_found()

    def not_found(self) -> None:
        body = b"Not here. Try the front door: /\n"
        self.send_response(HTTPStatus.NOT_FOUND)
        self.send_header("Content-Type", "text/plain; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(body)


def make_server() -> ThreadingHTTPServer:
    port = START_PORT
    for _ in range(12):
        try:
            return ThreadingHTTPServer(("0.0.0.0", port), PreviewHandler)
        except OSError:
            port += 1
    raise SystemExit("No free port found between 8000 and 8011.")


if __name__ == "__main__":
    httpd = make_server()
    port = httpd.server_address[1]
    ip = lan_ip()
    print("=" * 58)
    print("  For Anushka — local preview")
    print("=" * 58)
    print(f"  This computer : http://localhost:{port}")
    print(f"  Phone / LAN   : http://{ip}:{port}")
    print("  (both devices on the same Wi-Fi)")
    print()
    print("  PRIVATE: photos of a minor. Do not port-forward,")
    print("  tunnel, or share this link outside the household.")
    print("  Press Ctrl+C to stop.")
    print("=" * 58)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n  Stopped.")
    finally:
        httpd.server_close()
