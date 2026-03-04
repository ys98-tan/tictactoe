# 🎯 Command Reference Card

## ⚡ Essential Commands

### Start Everything
```bash
# Terminal 1: Start Docker
docker-compose up

# Terminal 2: Start Frontend (wait for Docker to be ready)
npm install
npm run dev -- --host
```

### Open the Game
```
http://localhost:5173
```

### Stop Everything
```bash
# Stop containers (keep data)
docker-compose stop

# Stop and remove containers (keep data)
docker-compose down

# Stop and DELETE everything
docker-compose down -v
```

---

## 🐳 Docker Commands

```bash
# View running containers
docker-compose ps

# View container logs (live)
docker-compose logs -f

# View specific service logs
docker-compose logs spacetimedb

# Restart containers
docker-compose restart

# Restart specific service
docker-compose restart spacetimedb

# Stop all containers
docker-compose stop

# Remove containers and volumes
docker-compose down -v

# Access container shell
docker-compose exec spacetimedb bash
```

---

## 📦 npm Commands

```bash
# Install dependencies
npm install

# Start dev server (local only)
npm run dev

# Start dev server (network accessible)
npm run dev -- --host

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 🎮 Playing the Game

### Same Machine (Two Tabs)
1. Open `http://localhost:5173` in Tab 1
2. Open `http://localhost:5173` in Tab 2
3. Tab 1: "Create Game" → Copy ID
4. Tab 2: Paste ID → "Join Game"
5. Play!

### Different Machines
1. Machine 1: `npm run dev -- --host`
2. Note the Network URL (e.g., `http://[ip]:5173`)
3. Machine 2: Open that URL
4. Create game on Machine 1, join on Machine 2

---

## 🔧 Configuration

### Change Port
```yaml
# docker-compose.yml
ports:
  - "3001:3000"  # Use 3001 instead of 3000
```

Then update `frontend/src/App.tsx`:
```typescript
const conn = new DbConnection("ws://localhost:3001");
```

### Check PostgreSQL Logs
```bash
docker-compose logs -f spacetimedb | grep -i error
```

### View Database Tables
Inside container:
```bash
docker-compose exec spacetimedb spacetimedb console
```

---

## 🐛 Debugging

### Check Everything Runs
```bash
# Docker running?
docker-compose ps

# Frontend accessible?
curl http://localhost:5173

# WebSocket reachable?
# (Open browser DevTools → Console → Check for messages)
```

### Clear Cache & Reinstall
```bash
# Delete dependencies
rm -rf node_modules
rm package-lock.json

# Reinstall
npm install

# Delete Docker data
docker-compose down -v
docker-compose up
```

### View Frontend Logs
Open browser DevTools (F12) → Console tab

---

## 📊 Ports Used

| Port | Service | URL |
|------|---------|-----|
| 3001 | SpacetimeDB API | ws://localhost:3001 |
| 5173 | Frontend Dev Server | http://localhost:5173 |

---

## 📝 File Locations

```
tictactoe/
├── docker-compose.yml           Docker config
├── start-docker.bat             Windows startup
├── start-docker.sh              Mac/Linux startup
│
├── frontend/
│   └── src/
│       ├── App.tsx              Main game component
│       ├── Board.tsx            Game board
│       └── spacetimedb-client.ts  WebSocket client
│
├── spacetimedb/
│   └── src/
│       └── lib.rs               Rust game logic
│
└── docs/
    ├── QUICKSTART.md            5-min setup
    ├── DOCKER_SETUP.md          Docker guide
    ├── DEPLOYMENT_GUIDE.md      Local vs Cloud
    ├── IMPLEMENTATION_DETAILS.md Code walkthrough
    ├── DOCKER_COMPLETE.md       Full setup summary
    └── README.md                Overview
```

---

## ✨ Common Workflows

### Development Cycle
```bash
# 1. Start Docker (once)
docker-compose up

# 2. Start frontend (keep running)
npm run dev -- --host

# 3. Edit code (auto-reloads)
# Edit frontend/src/App.tsx

# 4. Test in browser (F5 to refresh)
# Click around, try the game

# Repeat 3-4 as needed
```

### Switching Between Local & Cloud
```bash
# Local
const conn = new DbConnection("ws://localhost:3001");

# Cloud
const conn = new DbConnection("https://your-module.spacetimedb.com");
```

### Reset Everything
```bash
# Stop and delete
docker-compose down -v

# Clean node modules
rm -rf node_modules
npm install

# Restart
docker-compose up
npm run dev -- --host
```

---

## 🎯 Typical Session

```bash
# Start of day
docker-compose up                    # Terminal 1
npm run dev -- --host                # Terminal 2
# Keep both running all session

# Test changes
# Edit src/App.tsx
# Browser auto-reloads
# Play test game

# End of day
Ctrl+C in both terminals
# Data saved automatically

# Next day
docker-compose up                    # Data restored!
npm run dev -- --host
# Continue developing
```

---

## 📱 Multi-Device Testing

```bash
# Get your machine's IP
ipconfig getifaddr en0                  # Mac
hostname -I | awk '{print $1}'          # Linux
ipconfig                                # Windows → IPv4 Address

# Share with others
npm run dev -- --host
# Send them: http://<your-ip>:5173
```

---

## ⚙️ Environment Variables

Create `.env.local`:
```
VITE_SPACETIMEDB_URL=ws://localhost:3001
VITE_LOG_LEVEL=debug
```

Usage:
```typescript
const url = import.meta.env.VITE_SPACETIMEDB_URL || "ws://localhost:3001";
```

---

## Quick Decision Tree

**What do you want to do?**

→ **Play the game locally**
```bash
docker-compose up
npm run dev -- --host
```

→ **Test with friend on same network**
```bash
npm run dev -- --host
# Give them your network IP + port 5173
```

→ **Debug frontend**
```bash
npm run dev -- --host
# Open DevTools (F12) → Console
```

→ **Debug backend**
```bash
docker-compose logs -f spacetimedb
```

→ **Reset everything**
```bash
docker-compose down -v
rm -rf node_modules
npm install
npm run build
```

---

## 📞 Quick Help

**Can't connect?**
→ `docker-compose ps` and check if container is "Up"

**Port already in use?**
→ Change port in docker-compose.yml + App.tsx

**Game stopped updating?**
→ Refresh browser or restart Docker

**Module not deploying?**
→ `spacetimedb auth login` and try again

**Stuck?**
→ Check DOCKER_SETUP.md troubleshooting section

---

**Bookmark this file for quick reference!** 🚀
