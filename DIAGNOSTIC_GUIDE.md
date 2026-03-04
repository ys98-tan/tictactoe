# 🔍 Diagnostic Tools Guide

## Overview

Two automated diagnostic scripts are available to help troubleshoot connection issues:

- **Windows**: `diagnose.ps1` (PowerShell)
- **Mac/Linux**: `diagnose.sh` (Bash)

These scripts perform comprehensive system checks in seconds.

---

## Windows: Using diagnose.ps1

### Run the Script

```powershell
.\diagnose.ps1
```

### What It Checks

1. **Docker Installation** - Verifies Docker is installed
2. **Docker Daemon** - Checks if Docker is running
3. **Container Status** - Verifies SpacetimeDB container is up and healthy
4. **Port 3001** - Confirms the port is in use
5. **WebSocket Connectivity** - Tests http://localhost:3001/health
6. **Configuration Files** - Verifies key files exist
7. **Frontend Server** - Tests if frontend is running on port 5173

### Interpreting Output

✅ = Working correctly
❌ = Not working, needs fixing
⚠️ = Warning, may need attention

### Example Output

```
================================
  🔧 System Diagnostics Check
================================

1. Checking Docker Installation...
   ✅ Docker: Docker version 24.0.0

2. Checking Docker Daemon...
   ✅ Docker daemon is running

3. Checking SpacetimeDB Container...
   ✅ Container is running
      Status: Up 2 minutes (healthy)

4. Checking Port 3001...
   ✅ Port 3001 is in use

5. Checking WebSocket Connectivity...
   ✅ Server is reachable at http://localhost:3001

6. Checking Configuration Files...
   ✅ docker-compose.yml
   ✅ frontend/src/App.tsx
   ✅ frontend/src/spacetimedb-client.ts

7. Checking Frontend Server...
   ✅ Frontend is running at http://localhost:5173

================================
  📊 Diagnostic Summary
================================

✅ Everything looks good!

Next steps:
1. Open http://localhost:5173 in your browser
2. Look for connection status indicator
3. See 'COMMANDS.md' or 'QUICKSTART.md' for more
```

---

## Mac/Linux: Using diagnose.sh

### Make Script Executable

```bash
chmod +x diagnose.sh
```

### Run the Script

```bash
./diagnose.sh
```

### Output

Same checks as Windows version, displayed in a terminal-friendly format.

---

## Common Diagnostic Results

### Everything Works ✅

```
✅ Everything looks good!
```

**Next:** Open http://localhost:5173 and start playing!

---

### Docker Not Running ❌

```
3. Checking SpacetimeDB Container...
   ❌ Container not found. Run 'docker-compose up'
```

**Fix:**
```bash
docker-compose up
```

Wait for the logs to show `Listening on 0.0.0.0:3000` (30 seconds).

---

### Port Conflict ❌

```
4. Checking Port 3001...
   ⚠️  Port 3001 doesn't seem to be in use
```

**Fix:**

Option A: Stop whatever is using port 3001

Option B: Use a different port
1. Edit `docker-compose.yml`: Change `"3001:3000"` to `"3002:3000"`
2. Edit `frontend/src/App.tsx`: Change `ws://localhost:3001` to `ws://localhost:3002`
3. Run `docker-compose up` again

---

### Server Not Reachable ❌

```
5. Checking WebSocket Connectivity...
   ❌ Server not reachable at http://localhost:3001
```

**Fix:**
```bash
# Check Docker logs for errors
docker-compose logs spacetimedb

# Restart Docker
docker-compose down
docker-compose up
```

---

### Frontend Not Running ❌

```
7. Checking Frontend Server...
   ⚠️  Frontend not reachable at http://localhost:5173
```

**Fix:**
```bash
npm run dev -- --host
```

---

## When To Use the Diagnostic Scripts

Run the diagnostic script when:
- ❌ You see "⚠️ Offline Mode" in the browser
- ❌ Games aren't syncing between tabs
- ❌ Connection keeps dropping
- ❌ You're setting up the project for the first time
- ❌ After changes to docker-compose or port configuration

---

## Troubleshooting Beyond Diagnostics

If the diagnostic script still shows errors:

1. **Read the detailed message** - Each error has suggested fixes
2. **Check the logs**:
   ```bash
   docker-compose logs spacetimedb
   ```
3. **Consult CONNECTION_TROUBLESHOOTING.md** - Detailed 8-step guide
4. **Check browser console** - Press F12, look for WebSocket errors

---

## Manual Checks (If You Prefer)

Don't want to run a script? Manually verify these:

```bash
# Is Docker running?
docker ps

# Is the container healthy?
docker-compose ps

# Can you reach the server?
curl http://localhost:3001/health

# What port is in use?
# Windows: netstat -ano | findstr :3001
# Mac/Linux: lsof -i :3001

# What's in the logs?
docker-compose logs spacetimedb --tail 50
```

---

## Summary

| Scenario | Command |
|----------|---------|
| **First time setup** | `./diagnose.ps1` (Windows) or `./diagnose.sh` (Mac/Linux) |
| **Connection issues** | Run diagnostic, then read CONNECTION_TROUBLESHOOTING.md |
| **Port conflicts** | Use diagnose.ps1 to identify, then edit docker-compose.yml |
| **Docker not running** | `docker-compose up` |
| **Container crashed** | `docker-compose logs` then `docker-compose down && docker-compose up` |

---

## Next Steps

✅ Run the diagnostic script
➡️ Fix any issues shown
➡️ Open http://localhost:5173
➡️ Look for "✅ Connected"
➡️ Play tic-tac-toe!
