@echo off
REM Start Local Development Environment
REM Windows batch script

echo.
echo =====================================
echo  🎮 TIC-TAC-TOE LOCAL SETUP
echo =====================================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker not found!
    echo.
    echo Please install Docker Desktop:
    echo https://docs.docker.com/desktop/install/windows-install/
    echo.
    pause
    exit /b 1
)

echo ✅ Docker found
echo.

REM Check if docker-compose is available
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ⚠️  docker-compose not found (trying 'docker compose')
    docker compose --version >nul 2>&1
    if errorlevel 1 (
        echo ❌ docker-compose not available!
        pause
        exit /b 1
    )
    set COMPOSE=docker compose
) else (
    set COMPOSE=docker-compose
)

echo ✅ docker-compose found
echo.

REM Start the containers
echo Starting containers...
%COMPOSE% up -d

if errorlevel 1 (
    echo ❌ Failed to start containers
    pause
    exit /b 1
)

echo.
echo ✅ SpacetimeDB container started!
echo.
echo 📡 SpacetimeDB is running on: ws://localhost:3001
echo 🎮 Management console: http://localhost:9000
echo.
echo =====================================
echo.
echo In a NEW terminal window, run:
echo.
echo   npm install
echo   npm run dev -- --host
echo.
echo Then open: http://localhost:5173
echo.
echo Press any key to continue...
pause

echo.
echo Shows running containers...
%COMPOSE% ps

echo.
echo Type 'exit' and then run these commands to stop:
echo.
echo   docker-compose down       (stop containers)
echo   docker-compose down -v    (stop and delete data)
echo.
pause
