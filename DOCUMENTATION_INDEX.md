# 📚 Documentation Index

Quick reference for all documentation files in this project.

---

## 🚀 Getting Started (Pick One)

| File | Purpose | Best For |
|------|---------|----------|
| **[QUICKSTART.md](QUICKSTART.md)** | Fast setup, 5 minutes | First time users |
| **[README.md](README.md)** | Overview, architecture, features | Understanding the project |
| **[DOCKER_SETUP.md](DOCKER_SETUP.md)** | Docker/local config details | Using Docker container |

---

## 🔧 Troubleshooting (When Things Break)

| File | Purpose | Symptoms |
|------|---------|----------|
| **[DIAGNOSTIC_GUIDE.md](DIAGNOSTIC_GUIDE.md)** | Automated diagnosis tools | "Let scripts fix it" approach |
| **[CONNECTION_TROUBLESHOOTING.md](CONNECTION_TROUBLESHOOTING.md)** | 8-step manual debugging | Shows "⚠️ Offline Mode" |
| **[COMMANDS.md](COMMANDS.md)** | All useful CLI commands | Need command reference |

---

## 📖 Learning & Reference

| File | Purpose | Best For |
|------|---------|----------|
| **[SPACETIMEDB_EXPLANATION.md](SPACETIMEDB_EXPLANATION.md)** | How SpacetimeDB works | Learning concepts |
| **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** | Production deployment info | Going live / beyond local |

---

## 🤖 Diagnostic Tools

Two scripts automatically check your setup:

```bash
# Windows
.\diagnose.ps1

# Mac/Linux
./diagnose.sh
```

Both scripts verify:
- Docker installation
- Container health
- Port configuration
- Server connectivity
- File configuration

See [DIAGNOSTIC_GUIDE.md](DIAGNOSTIC_GUIDE.md) for details.

---

## Decision Tree: Which File to Read?

```
👋 I just cloned this project
  └─► READ: QUICKSTART.md (5 min setup)

❌ I see "⚠️ Offline Mode" in browser
  └─► RUN: ./diagnose.ps1 (Windows) or ./diagnose.sh (Mac/Linux)
      THEN READ: CONNECTION_TROUBLESHOOTING.md (if needed)

😕 I want to understand what SpacetimeDB does
  └─► READ: SPACETIMEDB_EXPLANATION.md

🐳 I want to use Docker for local development
  └─► READ: DOCKER_SETUP.md

🚀 I want to deploy this to production
  └─► READ: DEPLOYMENT_GUIDE.md

❓ What commands can I run?
  └─► READ: COMMANDS.md

🏗️ I want to understand the project architecture
  └─► READ: README.md

---

## File Location Reference

```
tictactoe/
├── README.md                           # Main overview
├── QUICKSTART.md                       # 5-minute setup
├── DOCKER_SETUP.md                     # Docker configuration
├── DOCKER_COMPLETE.md                  # Detailed Docker guide
├── DEPLOYMENT_GUIDE.md                 # Production deployment
├── SPACETIMEDB_EXPLANATION.md          # Concept deep dive
├── COMMANDS.md                         # CLI commands
├── CONNECTION_TROUBLESHOOTING.md       # Debug WebSocket issues
├── DIAGNOSTIC_GUIDE.md                 # Diagnostic tools help
├── SETUP_COMPLETE.md                   # Project status summary
├── DOCUMENTATION_INDEX.md              # This file
├── diagnose.ps1                        # Windows diagnostic script
├── diagnose.sh                         # Mac/Linux diagnostic script
├── docker-compose.yml                  # Docker config
├── package.json                        # Dependencies
├── tsconfig.json                       # TypeScript config
├── vite.config.ts                      # Vite config
├── spacetimedb/
│   └── src/
│       └── lib.rs                      # Backend game logic
└── frontend/
    ├── src/
    │   ├── App.tsx                     # Main game UI
    │   ├── Board.tsx                   # Game board component
    │   └── spacetimedb-client.ts       # WebSocket client
    ├── index.html
    └── vite.config.ts
```

---

## Common Scenarios

### "I'm brand new to this project"
1. Read [QUICKSTART.md](QUICKSTART.md) (5 min)
2. Follow the 4 steps
3. Play a game!

### "I set it up but can't connect"
1. Run `./diagnose.ps1` or `./diagnose.sh`
2. Check what failed
3. Read [CONNECTION_TROUBLESHOOTING.md](CONNECTION_TROUBLESHOOTING.md) for that specific issue
4. Apply the fix
5. Run diagnostic again to verify

### "I want to deploy this online"
1. Read [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
2. Follow the cloud deployment steps
3. Update connection URL in App.tsx
4. Test in production

### "Docker doesn't work on my machine"
1. Run `./diagnose.ps1` or `./diagnose.sh`
2. Look for ❌ errors
3. Follow the script's suggested fixes
4. Re-run to verify

### "Games aren't syncing between tabs"
1. Check browser console (F12)
2. Look for connection errors
3. Run diagnostic script
4. Read [CONNECTION_TROUBLESHOOTING.md](CONNECTION_TROUBLESHOOTING.md)

### "I want to understand how it works"
1. [README.md](README.md) - Architecture overview
2. [SPACETIMEDB_EXPLANATION.md](SPACETIMEDB_EXPLANATION.md) - Concepts
3. [spacetimedb/src/lib.rs](spacetimedb/src/lib.rs) - Backend code
4. [frontend/src/App.tsx](frontend/src/App.tsx) - Frontend code

---

## Documentation Updates

- ✅ This index created when connection diagnostics were added
- ✅ All files validated and linked
- ✅ Diagnostic scripts (diagnose.ps1, diagnose.sh) added
- ✅ CONNECTION_TROUBLESHOOTING.md includes diagnostic tool references
- ✅ README.md points to DIAGNOSTIC_GUIDE and CONNECTION_TROUBLESHOOTING

---

## Next Steps

1. **New to the project?** → Start with [QUICKSTART.md](QUICKSTART.md)
2. **Having issues?** → Run diagnostic script or read [CONNECTION_TROUBLESHOOTING.md](CONNECTION_TROUBLESHOOTING.md)
3. **Want to learn?** → Read [SPACETIMEDB_EXPLANATION.md](SPACETIMEDB_EXPLANATION.md)
4. **Going to production?** → Check [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

---

**Happy coding! 🚀**
