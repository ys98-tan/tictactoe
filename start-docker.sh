#!/bin/bash

# Start Local Development Environment
# macOS and Linux bash script

echo ""
echo "====================================="
echo "  🎮 TIC-TAC-TOE LOCAL SETUP"
echo "====================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found!"
    echo ""
    echo "Please install Docker:"
    echo "  macOS: https://docs.docker.com/desktop/install/mac-install/"
    echo "  Linux: https://docs.docker.com/engine/install/"
    echo ""
    read -p "Press Enter to exit..."
    exit 1
fi

echo "✅ Docker found ($(docker --version))"
echo ""

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "⚠️  docker-compose not found (trying 'docker compose')"
    if ! command -v docker compose &> /dev/null; then
        echo "❌ docker-compose not available!"
        read -p "Press Enter to exit..."
        exit 1
    fi
    COMPOSE="docker compose"
else
    COMPOSE="docker-compose"
fi

echo "✅ $COMPOSE found"
echo ""

# Start the containers
echo "Starting containers..."
$COMPOSE up -d

if [ $? -ne 0 ]; then
    echo "❌ Failed to start containers"
    read -p "Press Enter to exit..."
    exit 1
fi

echo ""
echo "✅ SpacetimeDB container started!"
echo ""
echo "📡 SpacetimeDB is running on: ws://localhost:3001"
echo "🎮 Management console: http://localhost:9000"
echo ""
echo "====================================="
echo ""
echo "In a NEW terminal window, run:"
echo ""
echo "  npm install"
echo "  npm run dev -- --host"
echo ""
echo "Then open: http://localhost:5173"
echo ""

# Check container status
echo ""
echo "Container status:"
$COMPOSE ps

echo ""
echo "To stop:"
echo "  $COMPOSE down       (stop containers)"
echo "  $COMPOSE down -v    (stop and delete data)"
echo ""

# Optional: Show logs
echo "Showing logs (press Ctrl+C to exit)..."
read -p "Press Enter to start logs..."
$COMPOSE logs -f
