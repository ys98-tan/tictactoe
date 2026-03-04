# 🔧 WebSocket Connection Troubleshooting Guide

## Problem: "⚠️ Offline Mode" - Can't Connect to SpacetimeDB

Your browser shows "⚠️ Offline Mode" instead of "✅ Connected"? Here's how to fix it.

---

## What This Means

- **✅ Connected** = Frontend is connected to SpacetimeDB, ready for multiplayer
- **⚠️ Offline Mode** = Frontend can't reach SpacetimeDB, games run locally only

---

## Step-by-Step Troubleshooting

### 1️⃣ Verify Docker is Running

Check if the SpacetimeDB container is actually running:

```bash
docker-compose ps
```

You should see:
```
NAME               STATUS
spacetimedb-local  Up (healthy)
```

**If it's NOT running:**
```bash
docker-compose up
```

Wait 30 seconds for it to be ready (says "Listening on 0.0.0.0:3000" in logs).

---

### 2️⃣ Check the Port Configuration

Verify port 3001 is correctly mapped:

```bash
docker-compose ps
```

Should show:
```
PORTS
0.0.0.0:3001->3000/tcp
```

This means:
- Host machine: port 3001
- Container: port 3000

---

### 3️⃣ Test Docker is Listening

```bash
curl http://localhost:3001/health
```

Should return `OK` or similar. If it fails, Docker container might not be healthy.

---

### 4️⃣ Check Browser Console

Open DevTools (`F12`) → Console tab

Look for messages like:
- `✅ Connected to SpacetimeDB` ✓ Good
- `❌ WebSocket error` → Check step 5
- `⚠️ Offline Mode` → Keep reading

---

### 5️⃣ Verify WebSocket URL

The frontend tries to connect to: **`ws://localhost:3001`**

Check if this matches your configuration:
- `frontend/src/App.tsx` line 21: `new DbConnection("ws://localhost:3001")`
- `docker-compose.yml` line 7: `- "3001:3000"`

**If port is different:**
1. Change docker-compose.yml port
2. Change App.tsx connection URL to match
3. Restart Docker and frontend

---

### 6️⃣ Check for Port Conflicts

If port 3001 is already in use by another service:

**Windows:**
```powershell
netstat -ano | findstr :3001
```

**Mac/Linux:**
```bash
lsof -i :3001
```

If something is using port 3001, either:
- Stop that service, OR
- Use a different port (e.g., 3002)

Then update:
1. `docker-compose.yml`: `"3002:3000"`
2. `App.tsx`: `ws://localhost:3002`

---

### 7️⃣ Check Docker Logs

```bash
docker-compose logs spacetimedb
```

Look for:
- ✅ `Listening on` → Container is running
- ❌ `error`, `panic`, `failed` → Container crashed

If crashed, try:
```bash
docker-compose down
docker-compose up
```

---

### 8️⃣ Check Network Settings

If testing from **different machine** (not localhost):

**Problem:** `ws://localhost:3001` won't work from another machine

**Solution:** Use machine's IP address instead

```bash
# Get your machine IP
ipconfig                # Windows
hostname -I             # Linux
ifconfig                # Mac
```

Then in `App.tsx`:
```typescript
const conn = new DbConnection("ws://YOUR_IP:3001");
```

Example:
```typescript
const conn = new DbConnection("ws://192.168.1.100:3001");
```

---

## Quick Diagnosis Flowchart

```
Is Docker running?
├─ NO  → Run: docker-compose up
└─ YES → Continue

Does Docker say "healthy"?
├─ NO  → Wait 30s, check logs
└─ YES → Continue

Can you curl http://localhost:3001/health?
├─ NO  → Port conflict? Check step 6
└─ YES → Continue

Check browser DevTools console:
├─ See "WebSocket error" → Check firewall
├─ See "Connected" → Should show ✅
└─ See nothing → Refresh browser
```

---

## When Offline Mode Is Okay

**⚠️ Offline Mode still works for testing!** You can:
- ✅ Create games locally
- ✅ Join games
- ✅ Play tic-tac-toe normally
- ✅ Save game state (in browser memory)

**What you CAN'T do:**
- ❌ Sync between machines
- ❌ Sync between browser tabs
- ❌ Persistent storage (refreshing loses data)

---

## Common Issues & Solutions

### "Connection refused"
- Docker not running
- Port misconfigured
- Wrong IP address (using localhost on different machine)

**Fix:**
```bash
docker-compose ps
docker-compose logs spacetimedb
```

### "Connection timeout"
- Docker container not ready yet
- Firewall blocking the port
- Wrong port number

**Fix:**
```bash
docker-compose logs spacetimedb | grep -i "listening\|error"
```

### "Connection keeps dropping"
- Browser tab losing connection
- Network instability
- Spacedb server restarting

**Fix:**
- Check Docker health: `docker-compose ps`
- Check logs: `docker-compose logs spacetimedb`
- Restart: `docker-compose down && docker-compose up`

### "Connected but games not syncing"
- Client not properly sending messages
- Server not properly receiving messages

**Fix:**
- Open DevTools Console
- Look for `🚀 Called reducer:` messages
- Should see game updates logged

---

## 🤖 Quick Diagnostic Scripts

Prefer automation? Use these diagnostic scripts:

**Windows Users:**
```powershell
.\diagnose.ps1
```

**Mac/Linux Users:**
```bash
chmod +x diagnose.sh
./diagnose.sh
```

Both scripts automatically check:
- ✅ Docker installation
- ✅ Container status
- ✅ Port availability  
- ✅ Server connectivity
- ✅ Configuration files
- ✅ Frontend status

Just run the appropriate script and follow its recommendations.

---

## Testing Checklist

- [ ] `docker-compose ps` shows "Up"
- [ ] `curl http://localhost:3001/health` returns OK
- [ ] Browser shows "✅ Connected"
- [ ] DevTools console shows "✅ Connected to SpacetimeDB"
- [ ] Can create a game
- [ ] Can join with another tab
- [ ] Both tabs show same game state

---

## Still Stuck?

### Get More Debug Info

```bash
# 1. Check Docker container health
docker inspect spacetimedb-local | grep -A 5 "Health"

# 2. Check detailed logs
docker-compose logs spacetimedb --tail 50

# 3. Check network
docker network ls
docker network inspect tictactoe_default

# 4. Restart everything
docker-compose down -v
docker-compose up
npm run dev -- --host
```

### Advanced: Access Container Shell

```bash
docker-compose exec spacetimedb bash
```

Then inside container:
```bash
netstat -tuln | grep 3000
curl http://localhost:3000/health
```

---

## Connection Status Reference

In the app UI:

```
✅ Connected - Connected to SpacetimeDB
   └─ Best for: Multiplayer, syncing between machines

⚠️ Offline Mode - Running games locally
   └─ Works for: Testing, single player, same-machine play
   └─ Issue: No sync between browser tabs/machines
```

---

## When to Use Offline Mode

Even though it shows a warning, **⚠️ Offline Mode works fine for**:
- Testing game logic locally
- Playing single-player
- Testing with same-browser-tabs

**Upgrade to Connected when ready for:**
- Real multiplayer
- Testing with multiple machines
- Production deployment

---

## Port Reference

```
Frontend (Vite):        http://localhost:5173
SpacetimeDB HTTP:       http://localhost:3001
SpacetimeDB WebSocket:  ws://localhost:3001
Management Console:     http://localhost:9000
```

---

**Still having issues?** Check:
1. Browser console (F12)
2. Docker logs (`docker-compose logs`)
3. This guide's troubleshooting section
4. Compare configurations with this file
