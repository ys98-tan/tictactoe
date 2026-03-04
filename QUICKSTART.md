# 🚀 Local Development Quick Start

Get the entire game running locally in **5 minutes** using Docker.

## Requirements

✅ Have installed:
- Node.js (v16+)
- Docker Desktop

Don't have Docker? [Download here](https://www.docker.com/products/docker-desktop)

## ⚡ Super Quick Start

### Windows Users
```powershell
# Terminal 1
.\start-docker.bat

# Terminal 2 (wait 5 seconds for Docker)
npm install
npm run dev -- --host
```

### Mac/Linux Users
```bash
# Terminal 1
chmod +x start-docker.sh
./start-docker.sh

# Terminal 2 (wait 5 seconds for Docker)
npm install
npm run dev -- --host
```

### Manual Start (All Platforms)

**Terminal 1** - Start Docker:
```bash
docker-compose up
```

**Terminal 2** - Start Frontend:
```bash
npm install
npm run dev -- --host
```

---

## 🎮 Playing the Game

1. Open **two browser tabs**
2. Go to `http://localhost:5173`
3. **Tab 1**: Click "Create Game"
4. **Tab 1**: Copy the Game ID
5. **Tab 2**: Paste Game ID and click "Join Game"
6. **Play!** X goes first

---

## 📊 What's Running

```
Your Computer
├─ Docker Container (Port 3000)
│  └─ SpacetimeDB Game Server
│
└─ Your Browser (Port 5173)
   ├─ Tab 1: Player X
   └─ Tab 2: Player O
```

---

## ✔️ Verify Everything Works

### Check Docker is Running
```bash
docker-compose ps
```

Should show `spacetimedb-local` with status `Up`

### Check Frontend Server
Open `http://localhost:5173` - you should see the game UI

### Create and Join a Game
- Open two tabs
- Create game in Tab 1
- Join in Tab 2
- Click cells to play

---

## 🛑 Stop Everything

```bash
# Stop containers (keep data)
docker-compose stop

# Stop and remove containers
docker-compose down

# Stop and DELETE all data
docker-compose down -v
```

---

## 🔧 Common Issues

### Port 3000 Already Used
```yaml
# In docker-compose.yml, change:
ports:
  - "3001:3000"  # Use 3001 instead
```

### "Cannot connect to WebSocket"
1. Check Docker is running: `docker-compose ps`
2. Restart: `docker-compose down && docker-compose up`

### Windows: "Cannot find docker command"
- Install Docker Desktop from https://www.docker.com/products/docker-desktop
- Restart your terminal after install
- May need to restart your computer

---

## 🎓 Next Steps

### Play a Full Game
Open two tabs and play multiple games

### Read Documentation
- **DOCKER_SETUP.md** - Deep dive into Docker & advanced setup
- **IMPLEMENTATION_DETAILS.md** - Understand the code
- **README.md** - Full project overview

### Extend the Game
- Add chat between players
- Track statistics (wins/losses)
- Add game timer
- Create game variants

---

## ✨ You're Ready!

```bash
docker-compose up
npm run dev -- --host
```

Open `http://localhost:5173` and play! 🎮
