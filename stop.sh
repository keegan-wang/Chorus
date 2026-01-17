#!/bin/bash

# Chorus Stop Script
# This script stops all running Chorus services

echo "🛑 Stopping Chorus services..."

# Kill processes on our ports
echo "Stopping Frontend (port 3000)..."
lsof -ti:3000 | xargs kill -9 2>/dev/null && echo "✅ Frontend stopped" || echo "❌ No process on port 3000"

echo "Stopping Backend API (port 3001)..."
lsof -ti:3001 | xargs kill -9 2>/dev/null && echo "✅ Backend API stopped" || echo "❌ No process on port 3001"

echo "Stopping Python Agents (port 8000)..."
lsof -ti:8000 | xargs kill -9 2>/dev/null && echo "✅ Python Agents stopped" || echo "❌ No process on port 8000"

# Also kill any node/python processes with 'chorus' in the command
pkill -f "pnpm dev" 2>/dev/null
pkill -f "python main.py" 2>/dev/null
pkill -f "next dev" 2>/dev/null
pkill -f "nest start" 2>/dev/null

echo ""
echo "✅ All Chorus services stopped!"
echo ""
