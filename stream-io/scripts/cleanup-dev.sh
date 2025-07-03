#!/bin/bash

echo "🧹 Cleaning up development environment..."

# Kill any processes using development ports
echo "🔍 Checking for processes using ports 3001 and 5173..."

# Kill processes on port 3001 (backend)
PORT_3001_PID=$(lsof -ti:3001)
if [ ! -z "$PORT_3001_PID" ]; then
    echo "🔫 Killing process $PORT_3001_PID on port 3001..."
    kill -9 $PORT_3001_PID
    sleep 1
fi

# Kill processes on port 5173-5180 (frontend - Vite tries multiple ports)
for port in {5173..5180}; do
    PORT_PID=$(lsof -ti:$port)
    if [ ! -z "$PORT_PID" ]; then
        echo "🔫 Killing process $PORT_PID on port $port..."
        kill -9 $PORT_PID
        sleep 0.5
    fi
done

# Kill any remaining nodemon processes
echo "🎯 Cleaning up nodemon processes..."
pkill -f "nodemon" 2>/dev/null || true

# Kill any remaining ts-node processes
echo "🎯 Cleaning up ts-node processes..."
pkill -f "ts-node" 2>/dev/null || true

# Kill any remaining node processes for this project
echo "🎯 Cleaning up project-specific node processes..."
pkill -f "streamguide" 2>/dev/null || true
pkill -f "stream-io" 2>/dev/null || true

# Wait a moment for processes to fully terminate
sleep 2

# Verify ports are free
echo "✅ Verifying ports are free..."
if lsof -i :3001 >/dev/null 2>&1; then
    echo "⚠️  Port 3001 still in use:"
    lsof -i :3001
else
    echo "✅ Port 3001 is free"
fi

if lsof -i :5173 >/dev/null 2>&1; then
    echo "⚠️  Port 5173 still in use:"
    lsof -i :5173
else
    echo "✅ Port 5173 is free"
fi

echo "🎉 Development environment cleanup complete!"
echo "💡 You can now run 'npm run dev' safely" 