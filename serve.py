# Local preview server that never lets the browser cache files, so every
# refresh shows your latest changes.
#   python3 serve.py          -> http://localhost:8000
#   python3 serve.py 8001     -> another port
import http.server, sys

class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        self.send_header("Expires", "0")
        super().end_headers()

port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
print(f"Serving on http://localhost:{port}  (Ctrl+C to stop)")
http.server.ThreadingHTTPServer(("", port), NoCache).serve_forever()
