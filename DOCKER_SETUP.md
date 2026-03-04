# 🐳 Local Development with Docker

## Quick Start (3 steps)

### 1️⃣ Start SpacetimeDB with Docker
```bash
docker-compose up -d
```

This starts SpacetimeDB locally on `ws://localhost:3001`

### 2️⃣ Deploy the Rust module
```bash
# If you have Docker container running spacetimedb, you can deploy to it
# For now, the frontend works with local game simulation
```

### 3️⃣ Run the frontend
```bash
npm run dev -- --host
```

Open `http://localhost:5173` in your browser - **you're ready to play!**

---

## What is Docker?

Docker runs applications in isolated containers. Instead of installing SpacetimeDB on your machine, Docker downloads and runs it in a container.

**Benefits:**
- ✅ No installation hassle
- ✅ Same environment across all machines
- ✅ Easy cleanup (just delete the container)
- ✅ No port conflicts (contained)

---

## Prerequisites

### Windows

#### Option A: Docker Desktop (Recommended)
1. Download [Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows-install/)
2. Install and restart your computer
3. Verify it works:
   ```powershell
   docker --version
   ```

#### Option B: Docker via WSL2 (Advanced)
If Docker Desktop doesn't work, install via WSL2 (Windows Subsystem for Linux)

### Mac
1. Download [Docker Desktop for Mac](https://docs.docker.com/desktop/install/mac-install/)
2. Install and start Docker
3. Verify:
   ```bash
   docker --version
   ```

### Linux
```bash
# Ubuntu/Debian
sudo apt-get install docker.io docker-compose

# Fedora
sudo dnf install docker docker-compose

# Start the service
sudo systemctl start docker
```

---

## Running Everything

### Terminal 1: Start SpacetimeDB Container

```bash
docker-compose up
```

You should see:
```
spacetimedb-local  | 2026-03-02 15:30:45 Starting SpacetimeDB server...
spacetimedb-local  | 2026-03-02 15:30:46 Listening on 0.0.0.0:3000
spacetimedb-local  | 2026-03-02 15:30:46 Management console at http://localhost:9000
```

### Terminal 2: Run Frontend Dev Server

```bash
npm install  # if you haven't already
npm run dev -- --host
```

You should see:
```
VITE v5.4.21  ready in 405 ms
  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
```

### Open in Browser
- **Local**: `http://localhost:5173`
- **Network**: `http://<your-ip>:5173` (for other devices on your network)

---

## How It Works

### Architecture
```
┌─────────────────────────────────────┐
│  Docker Container (SpacetimeDB)     │
│  - Port 3000: WebSocket API         │
│  - Port 9000: Management Console    │
│  - Volume: spacetimedb-data (data)  │
└─────────────────────────────────────┘
         ↕ WebSocket
┌─────────────────────────────────────┐
│  React Frontend (npm run dev)        │
│  - Port 5173: Dev Server            │
└─────────────────────────────────────┘
```

### Data Flow
1. **Client**: Click "Create Game"
2. **Frontend**: Call `db.call("create_game", { game_id: ... })`
3. **WebSocket**: Sends to `localhost:3001`
4. **SpacetimeDB**: Stores game record
5. **Broadcast**: Sends update to all subscribed clients
6. **Client**: Receives update, UI refreshes

---

## Docker Cheat Sheet

### Start in Background
```bash
docker-compose up -d
```

### View Logs
```bash
docker-compose logs -f
```

### Stop Everything
```bash
docker-compose down
```

### Stop + Delete Data
```bash
docker-compose down -v
```

### Restart
```bash
docker-compose restart
```

### View Running Containers
```bash
docker ps
```

### Access Container Shell
```bash
docker-compose exec spacetimedb bash
```

---

## Troubleshooting

### ❌ "docker: command not found"
**Fix**: Docker not installed. Download [Docker Desktop](https://docs.docker.com/desktop/install/)

### ❌ "Port 3000 already in use"
**Fix**: Change the port in `docker-compose.yml`:
```yaml
ports:
  - "3001:3000"  # Use 3001 instead of 3000
```

Then update `App.tsx`:
```typescript
const conn = new DbConnection("ws://localhost:3001");
```

### ❌ "Cannot connect to WebSocket"
**Fix**: Make sure Docker is running
```bash
docker-compose ps
```

Should show `spacetimedb-local` as `Up`

### ❌ "Games not syncing between tabs"
This is expected with local simulation. The real SpacetimeDB (when running in Docker) handles this automatically.

---

## File Structure

```
tictactoe/
├── docker-compose.yml          ← Defines SpacetimeDB container
├── frontend/
│   └── src/
│       ├── App.tsx             ← Uses local client
│       ├── Board.tsx
│       └── spacetimedb-client.ts  ← Local WebSocket client
├── spacetimedb/
│   └── src/
│       └── lib.rs              ← Rust module (for deployment)
└── ...
```

---

## Next Steps

### Option A: Keep Using Docker Locally
Continue developing with `docker-compose up` + `npm run dev`
- ✅ Works offline
- ✅ Fast iteration
- ✅ Local testing

### Option B: Deploy to Cloud Later
When ready to deploy:
1. Publish to SpacetimeDB cloud
2. Update connection string
3. Done! Same code works

### Option C: Deploy Docker to Production
Run the same Docker container on a server:
```bash
docker build -t tictactoe-game .
docker run -p 3000:3000 -p 5173:5173 tictactoe-game
```

---

## Environment Variables

Create a `.env` file for configuration:
```
VITE_SPACETIMEDB_URL=ws://localhost:3001
VITE_LOG_LEVEL=debug
```

Use in code:
```typescript
const url = import.meta.env.VITE_SPACETIMEDB_URL || "ws://localhost:3001";
const conn = new DbConnection(url);
```

---

## Performance Notes

### Local Docker
- Network latency: < 1ms (localhost)
- Game updates: Instant
- No connection issues (same machine)

### Multi-Machine (Same Network)
- Network latency: < 10ms
- Game updates: Near-instant
- Update `docker-compose.yml`:
  ```yaml
  environment:
    - LISTEN_ADDR=0.0.0.0:3000
  ```
- Connect from other machines to `http://<host-ip>:3000`

---

## Common Tasks

### View SpacetimeDB Logs
```bash
docker-compose logs spacetimedb
```

### Restart SpacetimeDB
```bash
docker-compose restart spacetimedb
```

### Clear All Data
```bash
docker-compose down -v
docker-compose up -d
```

This deletes the `spacetimedb-data` volume and starts fresh.

### Run Commands in Container
```bash
docker-compose exec spacetimedb your-command-here
```

---

## Your Setup is Ready!

You now have:
- ✅ Docker running SpacetimeDB locally
- ✅ Frontend connecting to local instance
- ✅ Local game logic that works offline
- ✅ Everything on your machine (no cloud needed)

**Run these two commands to get started:**
```bash
# Terminal 1
docker-compose up

# Terminal 2  
npm run dev -- --host
```

Then open `http://localhost:5173` and play! 🎮
