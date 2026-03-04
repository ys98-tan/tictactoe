# ⚙️ Complete Setup Guide: Local vs Cloud

Choose your setup: **Local with Docker** or **Cloud Deployment**

---

## 🐳 Option A: Local Development (Docker)

**Best for:** Development, testing, offline work, no cloud signup

### Prerequisites
- Docker Desktop installed

### Setup Steps

#### 1. Start SpacetimeDB Container
```bash
docker-compose up
```

You should see:
```
spacetimedb-local | Listening on 0.0.0.0:3000
spacetimedb-local | Management console at http://localhost:9000
```

#### 2. In a New Terminal: Install & Run Frontend
```bash
npm install
npm run dev -- --host
```

You should see:
```
VITE v5.4.21 ready in 394 ms
➜  Local:   http://localhost:5173/
```

#### 3. Open in Browser
`http://localhost:5173`

#### 4. Play!
Open two tabs, create/join game, play ✨

### Connection String (Already Set)
```typescript
// frontend/src/App.tsx
const conn = new DbConnection("ws://localhost:3000");
```

### Data Persistence
- Data stored in `./spacetimedb-data` volume
- Survives container restart
- Delete with: `docker-compose down -v`

### Useful Commands
```bash
docker-compose ps              # View container status
docker-compose logs -f         # View live logs
docker-compose restart         # Restart container
docker-compose down -v         # Stop and delete data
```

---

## ☁️ Option B: Cloud Deployment (SpacetimeDB)

**Best for:** Production, sharing, team play, advanced features

### Prerequisites
- SpacetimeDB CLI installed
- Free account at spacetimedb.com

### Installation

#### 1. Install SpacetimeDB CLI
```bash
# macOS/Linux
curl -sSf https://install.spacetimedb.com | sh

# Windows
iwr https://install.spacetimedb.com/windows | iex

# Or download from: https://spacetimedb.com/docs/install
```

Verify:
```bash
spacetimedb --version
```

#### 2. Authenticate
```bash
spacetimedb auth login
```

Opens browser to log in / sign up. It's free!

#### 3. Deploy Rust Module
```bash
spacetimedb publish spacetimedb/
```

Copy the module address from output:
```
📦 Published to: https://abc123.spacetimedb.com
```

#### 4. Update Connection String
Edit `frontend/src/App.tsx`:

```typescript
// Change from:
const conn = new DbConnection("ws://localhost:3000");

// To (use your actual address):
const conn = new DbConnection("https://abc123.spacetimedb.com");
```

#### 5. Run Frontend
```bash
npm run dev -- --host
```

#### 6. Open in Browser
`http://localhost:5173`

### Advantages of Cloud
- ✅ No Docker needed
- ✅ Scalable automatically
- ✅ Run from anywhere
- ✅ Team collaboration
- ✅ Production-ready

---

## 🔄 Switching Between Local & Cloud

### From Local to Cloud (Dev Finished!)

1. **Publish module to cloud:**
   ```bash
   spacetimedb publish spacetimedb/
   ```

2. **Get your module address:**
   ```bash
   spacetimedb module list
   ```

3. **Update connection string:**
   ```typescript
   const conn = new DbConnection("https://your-module-id.spacetimedb.com");
   ```

4. **Deploy frontend:**
   ```bash
   npm run build              # Create optimized bundle
   npm run preview            # Test locally first
   ```
   Then deploy to Vercel, Netlify, or your host

### From Cloud Back to Local (Offline Testing)

1. **Update connection string:**
   ```typescript
   const conn = new DbConnection("ws://localhost:3000");
   ```

2. **Start Docker:**
   ```bash
   docker-compose up
   ```

3. **Run frontend:**
   ```bash
   npm run dev -- --host
   ```

---

## 📊 Comparison

| Aspect | Local Docker | Cloud |
|--------|-------------|-------|
| **Setup time** | 5 min | 10 min |
| **Internet required** | No | Yes |
| **Scalability** | Single machine | Unlimited |
| **Data persistence** | Local volume | Cloud database |
| **Team access** | Same network only | Worldwide |
| **Cost** | Free (Docker) | Free (basic), paid (advanced) |
| **Deployment** | `docker-compose up` | `spacetimedb publish` |
| **Offline work** | ✅ Works | ❌ Needs internet |
| **Production ready** | Not recommended | ✅ Yes |

---

## 🎯 Quick Reference

### I want to develop locally
```bash
docker-compose up              # Terminal 1
npm run dev -- --host          # Terminal 2
# SpacetimeDB on ws://localhost:3001
# Open http://localhost:5173
```

### I want to deploy to production
```bash
spacetimedb publish spacetimedb/
# Update connection string
npm run build
npx vercel deploy dist/
```

### I want to work with a team
```bash
# Deploy to cloud once
spacetimedb publish spacetimedb/

# Share the game URL
npm run dev -- --host
# Everyone opens http://your-ip:5173
```

### I want to test both
```bash
# Keep both running! Edit connection string to switch
# Or add environment variable:
const url = process.env.SPACETIMEDB_URL || "ws://localhost:3000";
const conn = new DbConnection(url);
```

---

## 🔐 Environment Variables

Create `.env.local` in project root:

```
VITE_SPACETIMEDB_URL=ws://localhost:3001
VITE_LOG_LEVEL=debug
```

Use in code:
```typescript
const url = import.meta.env.VITE_SPACETIMEDB_URL || "ws://localhost:3001";
const conn = new DbConnection(url);
```

Different URLs for different environments:
- `.env.local` → Local development
- `.env.production` → Cloud production
- CI/CD automatically selects based on environment

---

## 🚀 Full Deployment Pipeline

### Development
```
Local Code → Docker (ws://localhost:3000) → Browser
```

### Testing with Team
```
Local Code → Docker (ws://localhost:3001) → Network (--host) → Multiple Browsers
```

### Production
```
Local Code → Deploy to Cloud (spacetimedb publish)
           ↓
Cloud Module → Frontend Deploy (Vercel/Netlify)
           ↓
https://game.example.com
```

---

## 📋 Deployment Checklist

### Before Going Live
- [ ] Tested with 2+ players locally
- [ ] All game logic validated
- [ ] No console errors
- [ ] Board displays correctly
- [ ] Move validation works
- [ ] Win detection works

### Deploying Backend
- [ ] `spacetimedb publish spacetimedb/`
- [ ] Copy module address
- [ ] Verified no build errors

### Deploying Frontend
- [ ] Updated connection string to cloud module
- [ ] `npm run build` succeeds
- [ ] `npm run preview` works
- [ ] Deployed to Vercel/Netlify
- [ ] Cloud game loads in browser

### After Going Live
- [ ] Monitored for errors
- [ ] Tested basic gameplay
- [ ] Checked performance
- [ ] Celebrated launch! 🎉

---

## 🆘 Troubleshooting

### Docker Issues
- **Port 3000 in use**: Change port in docker-compose.yml + App.tsx
- **Container won't start**: `docker-compose down -v && docker-compose up`
- **Data lost**: Didn't use `-v` flag, data was deleted

### Cloud Issues
- **Module not publishing**: Check authentication: `spacetimedb auth login`
- **Connection fails**: Verify address in App.tsx matches your module
- **Module not found**: List modules: `spacetimedb module list`

### Switching Between
- **Can't connect after switching**: Check firewall/antivirus
- **Localhost not working**: Use `127.0.0.1` instead
- **Cloud not working**: Verify internet connection and authentication

---

## 📚 Next Steps

### Learning
- Read [DOCKER_SETUP.md](DOCKER_SETUP.md) - Deep dive into Docker
- Read [IMPLEMENTATION_DETAILS.md](IMPLEMENTATION_DETAILS.md) - Code walkthrough
- Read [README.md](README.md) - Full project overview

### Customization
- Change colors in Board.tsx
- Add chat/messaging
- Track statistics
- Create game variants
- Add leaderboards

### Deployment
- Host frontend on Vercel/Netlify
- Use custom domain
- Set up CI/CD pipeline
- Monitor gameplay analytics

---

## ✨ You're All Set!

Choose your path:
- **Local**: `docker-compose up && npm run dev -- --host`
- **Cloud**: `spacetimedb publish spacetimedb/ && npm run dev -- --host`

Either way, you have a complete multiplayer game! 🎮

---

**Questions?** Check the documentation or run one of the setup scripts:
- Windows: `.\start-docker.bat`
- Mac/Linux: `./start-docker.sh`
