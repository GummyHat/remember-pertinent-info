#!/bin/bash

# Simple launcher for Remember Pertinent Info website
# No database required - uses live QUACS data!

echo "🎓 Remember Pertinent Info - Course Prerequisite Tree"
echo "=================================================="
echo ""
echo "Opening standalone version with live QUACS data..."
echo ""

# Check if we're in the right directory
if [ ! -f "client/public/standalone.html" ]; then
    echo "Error: Please run this script from the project root directory"
    exit 1
fi

cd client/public

# Find an available port
PORT=8000
while lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; do
    PORT=$((PORT + 1))
done

echo "Starting web server on port $PORT..."
echo ""
echo "📍 Opening: http://localhost:$PORT/standalone.html"
echo ""
echo "Features:"
echo "  ✓ Live data from QUACS repository"
echo "  ✓ No database setup required"
echo "  ✓ Interactive prerequisite tree"
echo "  ✓ Search any RPI course"
echo ""
echo "Try searching for: CSCI-1200, MATH-1010, or 'Data Structures'"
echo ""
echo "Press Ctrl+C to stop the server"
echo "=================================================="
echo ""

# Open browser after a short delay
(sleep 2 && xdg-open "http://localhost:$PORT/standalone.html" 2>/dev/null || \
              open "http://localhost:$PORT/standalone.html" 2>/dev/null) &

# Start the server
python3 -m http.server $PORT
