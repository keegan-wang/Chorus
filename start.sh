#!/bin/bash

# Chorus Startup Script
# This script starts all services in separate terminal windows

echo "🚀 Starting Chorus..."

# Get the project directory
PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Kill any existing processes on our ports
echo "🧹 Cleaning up existing processes..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:8000 | xargs kill -9 2>/dev/null || true

# Wait a moment for ports to be freed
sleep 2

echo "📦 Starting Frontend & Backend API..."
# Open Terminal 1 - Frontend & Backend
osascript <<EOF
tell application "Terminal"
    activate
    do script "cd '$PROJECT_DIR' && echo '🌐 Starting Frontend (localhost:3000) & Backend API (localhost:3001)...' && pnpm dev"
end tell
EOF

# Wait for services to start
sleep 3

echo "🤖 Starting Python Agents..."
# Open Terminal 2 - Python Agents
osascript <<EOF
tell application "Terminal"
    do script "cd '$PROJECT_DIR/apps/agents' && echo '🐍 Starting Python Agents API (localhost:8000)...' && python main.py"
end tell
EOF

# Wait for agents to start
sleep 5

echo "🌍 Opening browser..."
# Open browser
open "http://localhost:3000"

echo ""
echo "✅ Chorus is starting!"
echo ""
echo "📍 Services:"
echo "   Frontend:    http://localhost:3000"
echo "   Backend API: http://localhost:3001/api/docs"
echo "   Agents API:  http://localhost:8000/docs"
echo ""
echo "⚠️  Keep the terminal windows open to keep services running"
echo "⚠️  Press Ctrl+C in each terminal to stop services"
echo ""