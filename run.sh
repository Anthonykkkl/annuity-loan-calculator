#!/bin/bash

# Annuity Loan Calculator - Run Script
# Simple script to start a local server and open the calculator

set -e

PORT=8000
URL="http://localhost:$PORT/index.html"

echo "🚀 Starting Annuity Loan Calculator..."
echo ""

# Always apply config.yml to index.html
if [ -f "apply-config.py" ]; then
    echo "🔧 Applying config.yml to index.html..."
    ./apply-config.py
    echo ""
else
    echo "⚠️  Warning: apply-config.py not found, skipping config application"
    echo ""
fi

# Function to kill existing server processes
kill_existing_servers() {
    echo "🔍 Checking for existing servers on port $PORT..."
    
    # Find processes using the port
    local pids=$(lsof -ti :$PORT 2>/dev/null)
    
    if [ ! -z "$pids" ]; then
        echo "🛑 Found existing server(s) on port $PORT, stopping them..."
        for pid in $pids; do
            kill $pid 2>/dev/null && echo "   ✓ Killed process $pid" || echo "   ⚠️  Could not kill process $pid"
        done
        # Wait a moment for the port to be released
        sleep 1
    else
        echo "✓ No existing servers found on port $PORT"
    fi
}

# Function to open browser
open_browser() {
    sleep 2
    echo "🌐 Opening browser at $1"
    if command -v open &> /dev/null; then
        open "$1"
    elif command -v xdg-open &> /dev/null; then
        xdg-open "$1"
    elif command -v start &> /dev/null; then
        start "$1"
    else
        echo "Please open $1 in your browser"
    fi
}

# Kill any existing servers on the port
kill_existing_servers
echo ""

# Try different server options in order of preference
if command -v uv &> /dev/null; then
    echo "✅ Using uv (Python)"
    echo "📡 Server running at $URL"
    echo "Press Ctrl+C to stop"
    echo ""
    open_browser "$URL" &
    uv run python -m http.server $PORT --bind 127.0.0.1
elif command -v php &> /dev/null; then
    echo "✅ Using PHP"
    echo "📡 Server running at $URL"
    echo "Press Ctrl+C to stop"
    echo ""
    open_browser "$URL" &
    php -S 127.0.0.1:$PORT
elif command -v npx &> /dev/null; then
    echo "✅ Using Node.js (http-server)"
    echo "📡 Server running at $URL"
    echo "Press Ctrl+C to stop"
    echo ""
    open_browser "$URL" &
    npx http-server -p $PORT
else
    echo "❌ Error: No suitable server found!"
    echo ""
    echo "Please install one of the following:"
    echo "  - uv (recommended): curl -LsSf https://astral.sh/uv/install.sh | sh"
    echo "  - Node.js: https://nodejs.org/"
    echo "  - PHP: https://www.php.net/"
    echo ""
    exit 1
fi
