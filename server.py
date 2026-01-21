#!/usr/bin/env -S uv run
"""
Simple HTTP server with no-cache headers for development
Prevents browser caching of HTML, CSS, and JS files
"""

import http.server
import socketserver
from datetime import datetime

PORT = 8001

class NoCacheHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """HTTP request handler with no-cache headers"""
    
    def end_headers(self):
        """Add no-cache headers before ending headers"""
        # Get file extension
        if self.path.endswith(('.html', '.css', '.js', '.json')):
            # Prevent caching for development files
            self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')
        
        # Call parent method
        super().end_headers()
    
    def log_message(self, format, *args):
        """Custom log format with timestamp"""
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        print(f"[{timestamp}] {format % args}")

def run_server():
    """Start the HTTP server"""
    with socketserver.TCPServer(("", PORT), NoCacheHTTPRequestHandler) as httpd:
        print(f"🚀 Server running at http://localhost:{PORT}/")
        print(f"📝 Cache headers: DISABLED (no-cache for .html, .css, .js, .json)")
        print(f"🔄 Press Ctrl+C to stop")
        print()
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\n👋 Server stopped")

if __name__ == "__main__":
    run_server()
