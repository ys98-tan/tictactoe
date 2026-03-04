# Multiplayer Tic-Tac-Toe with SpacetimeDB

A real-time multiplayer Tic-Tac-Toe game. Two players on different browser tabs (or different machines on the same network) share a live game board — moves appear instantly for both players with no custom server, no REST API, and no polling.

**Stack:**
- **Backend** — Rust compiled to WebAssembly, running inside SpacetimeDB
- **Database / real-time layer** — SpacetimeDB v2 (runs in Docker)
- **Frontend** — React 19 + TypeScript, bundled with Vite 5

---

## How It Works (Big Picture)

```
Browser (Player 1)                Browser (Player 2)
      │                                   │
      │   WebSocket (v1.json.spacetimedb) │
      └──────────────┬────────────────────┘
                     ▼
          ┌─────────────────────┐
          │    SpacetimeDB      │  ← Docker container on port 3001
          │  ┌───────────────┐  │
          │  │  Rust Module  │  │  ← your game logic (.wasm)
          │  │  (tictactoe)  │  │
          │  └───────────────┘  │
          │  Tables:            │
          │   games             │
          │   players           │
          │   moves             │
          └─────────────────────┘
```

SpacetimeDB is the database **and** the real-time pub/sub server in one.
When Player 1 makes a move, SpacetimeDB runs the Rust logic, updates the `games` table, and **pushes** the change to every subscribed client immediately — no client polling, no extra infrastructure.

---

## Project Structure

```
tictactoe/
├── docker-compose.yml          # SpacetimeDB container (port 3001:3000)
├── package.json                # npm scripts: dev / build / preview
├── vite.config.ts              # Vite: root=frontend/, host=0.0.0.0, port=5173
├── tsconfig.json               # TypeScript strict mode, target=ES2020
│
├── spacetimedb/                # Rust WASM backend
│   ├── Cargo.toml
│   └── src/
│       └── lib.rs              # Tables + Reducers (all game logic lives here)
│
└── frontend/
    ├── index.html              # Single HTML shell (<div id="root">)
    └── src/
        ├── main.tsx            # React root mount
        ├── App.tsx             # Lobby screen + game screen + state
        ├── Board.tsx           # 3×3 button grid component
        ├── spacetimedb-client.ts   # Custom SpacetimeDB WebSocket client
        └── spacetimedb-mock.ts     # Old local mock (kept for reference, unused)
```

---

## Prerequisites

| Tool | Purpose | Install |
|------|---------|---------|
| Docker Desktop | Runs SpacetimeDB locally | https://docs.docker.com/get-docker/ |
| Node.js 18+ | Runs the frontend dev server | https://nodejs.org |
| Rust (stable) + Cargo | Compiles the backend to WASM | `winget install Rustlang.Rustup` |
| wasm32 target | Cross-compile target for WASM | `rustup target add wasm32-unknown-unknown` |
| MSVC Build Tools | Rust linker on Windows | https://aka.ms/vs/17/release/vs_BuildTools.exe |
| SpacetimeDB CLI v2 | Publishes the module | See install command below |

**Install the SpacetimeDB CLI (Windows PowerShell):**
```powershell
iwr https://windows.spacetimedb.com -useb | iex
```

---

## Setup and Running

### 1. Start SpacetimeDB

```bash
docker compose up -d
```

SpacetimeDB is now listening on `http://localhost:3001`.

### 2. Build and publish the Rust module

```bash
cd spacetimedb
spacetime publish --module-path . tictactoe
```

This compiles `lib.rs` → `.wasm` and uploads it to the running container.
The name `tictactoe` becomes part of every URL the frontend uses.

Verify the tables exist:
```bash
spacetime sql tictactoe "SELECT * FROM games"
```

### 3. Start the frontend

```bash
# from project root
npm install
npm run dev
```

Open **http://localhost:5173** (or your machine's LAN IP on port 5173 from another device).

### 4. Set the server address (if needed)

If accessing from another machine, edit `frontend/src/App.tsx` line 21:
```ts
const conn = new DbConnection("ws://YOUR_LAN_IP:3001");
```

---

## Playing the Game

1. **Player 1** opens the app → clicks **Create Game** → copies the game ID shown
2. **Player 2** opens the app → pastes the game ID → clicks **Join Game**
3. Player X moves first; turns alternate; moves appear on both screens instantly
4. A winner or draw is announced; click **New Game** to play again

---

## Re-publishing After Rust Changes

```bash
cd spacetimedb
spacetime publish --module-path . tictactoe
```

> Re-publishing wipes all data (tables reset). Normal for development.

---

## Code Walkthrough

### Backend — `spacetimedb/src/lib.rs`

The entire backend is one Rust file. SpacetimeDB compiles it to WebAssembly and runs it inside the database process.

#### Tables

Three structs annotated with `#[table(...)]` become the database schema:

```rust
#[table(accessor = games, public)]
pub struct Game {
    #[primary_key]
    pub game_id: String,
    pub board: String,           // 9-char string: "X.O......" (. = empty)
    pub player_x: Option<String>,
    pub player_o: Option<String>,
    pub turn: String,            // "X" or "O"
    pub winner: Option<String>,  // "X", "O", "DRAW", or None
    pub created_at: u64,
}

#[table(accessor = players, public)]
pub struct Player {
    #[primary_key]
    pub id: String,        // "{game_id}:{player_id}" — composite to avoid duplicates
    pub game_id: String,
    pub player_id: String,
    pub symbol: String,
}

#[table(accessor = moves, public)]
pub struct Move {
    #[primary_key]
    #[auto_inc]
    pub move_id: u64,
    pub game_id: String,
    pub player_id: String,
    pub position: u8,      // 0–8, left-to-right, top-to-bottom
    pub timestamp: u64,
}
```

- `accessor = games` means the table is queried as `SELECT * FROM games` (lowercase accessor name, not the struct name `Game`)
- `public` means any connected client can subscribe to it
- `#[primary_key]` + `#[auto_inc]` on `move_id` gives auto-incrementing IDs

#### Reducers

Reducers are Rust functions annotated with `#[reducer]`. Clients call them by name via HTTP POST. SpacetimeDB injects `&ReducerContext` (database handle + caller info) as the first argument — clients do not pass this.

**`create_game(ctx, game_id)`** — Inserts a new blank game row (no-op if it already exists).

**`join_game(ctx, game_id, player_id)`** — Assigns the player to `player_x` or `player_o` (first come first served). Inserts a `Player` row for move attribution. Guard clauses prevent joining a finished game or joining twice.

**`make_move(ctx, game_id, player_id, position)`** — The core validator:
1. Bounds-check `position` (0–8)
2. Find the game, reject if over
3. Identify the player's symbol from `player_x` / `player_o`
4. Reject if it is not their turn
5. Reject if the cell is occupied
6. Place the symbol on the board
7. Run `check_winner` — if a winner is found, set `game.winner`; otherwise flip the turn
8. Insert a `Move` record for history
9. Call `ctx.db.games().game_id().update(game)` to commit

After `update()`, SpacetimeDB automatically pushes the changed row to all subscribed clients.

**`check_winner(board)`** — Pure Rust helper. Checks all 8 win patterns (3 rows, 3 columns, 2 diagonals). Returns `Some("X")`, `Some("O")`, `Some("DRAW")`, or `None`.

---

### Frontend — `spacetimedb-client.ts`

A hand-written WebSocket client that speaks the SpacetimeDB v2 `v1.json.spacetimedb` subprotocol. The official SDK does not run in browsers without bundler shims, so this is a thin custom client with zero extra dependencies.

#### Connection setup

```ts
this.wsUrl   = `ws://${host}/v1/database/tictactoe/subscribe`;
this.httpUrl = `http://${host}/v1/database/tictactoe`;
this.socket  = new WebSocket(this.wsUrl, ['v1.json.spacetimedb']);
```

The `v1.json.spacetimedb` subprotocol tells SpacetimeDB to send all row data as plain JSON (rather than binary BSATN).

#### Subscribe message

Sent once after the WebSocket opens:

```ts
socket.send(JSON.stringify({
  Subscribe: {
    query_strings: ['SELECT * FROM games', 'SELECT * FROM players', 'SELECT * FROM moves'],
    request_id: 0,
  }
}));
```

SpacetimeDB replies with `InitialSubscription` containing all current rows, then sends `TransactionUpdateLight` whenever any subscribed row changes.

#### Reducer calls (HTTP POST)

Reducers are called over HTTP, not WebSocket:

```ts
fetch(`http://HOST/v1/database/tictactoe/call/create_game`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(["game-123"]),   // positional array, ReducerContext is server-injected
});
```

#### Parsing incoming messages

Three message types matter:

| Message | When | What to do |
|---------|------|-----------|
| `IdentityToken` | On connect | Ignore (no auth needed) |
| `InitialSubscription` | After Subscribe | Load all current rows into `gameCache` |
| `TransactionUpdateLight` | After a reducer runs | Apply inserts/deletes to `gameCache` |

The tables are nested at different paths in each message type — `handleMessage` normalises all of them to a list of table objects and calls `applyTableUpdate` on each.

#### Row wire format quirks (v2-specific)

**Rows are double-encoded.** Each element in `inserts` / `deletes` is a JSON string that must be `JSON.parse`d:
```
inserts: ["[\"game-123\",\".........\",...]"]
          ↑ this is a string; JSON.parse it to get the actual array
```

**`updates` is an array, not an object.** A table delta looks like:
```json
{ "table_name": "games", "updates": [{ "deletes": [], "inserts": ["..."] }] }
```
`applyTableUpdate` iterates the array and concatenates all inserts/deletes.

**`Option<String>` uses array-discriminant encoding:**

| Rust value | Wire format |
|------------|-------------|
| `Some("hello")` | `[0, "hello"]` |
| `None` | `[1, {}]` or `[1, []]` |

`decodeSATSOption` converts this to `string | null` for the frontend.

#### Offline fallback

If the WebSocket never connects (Docker not running), `simulateReducerLocally` runs the same game logic in TypeScript so the UI is still playable for single-player testing.

---

### Frontend — `App.tsx`

Manages all React state and coordinates UI ↔ client.

#### State and the stale-closure fix

```ts
const [gameId, setGameId] = useState<string>("");
const gameIdRef = useRef<string>("");

const setGameIdBoth = (id: string) => {
  gameIdRef.current = id;   // updated immediately, readable by closures
  setGameId(id);            // triggers re-render
};
```

The subscription callback is registered once in `useEffect`. React closures capture variables **at the time the function is created** — if `gameId` were used directly, the callback would always see `""` (its initial value). The `useRef` is a mutable container that always holds the current value, so the callback can read it correctly even though it was created before any game existed.

#### Screens

- **Lobby** (when `currentGame === null`) — shows connection status, Create Game button, Join Game input, and the live list of all games in the database
- **Game board** (when `currentGame !== null`) — shows the board, whose turn it is, win/draw announcement, and a New Game button when finished

#### Symbol assignment

After the subscription fires with the joined game, a `useEffect` that watches `[currentGame, playerId]` determines whether the local player is X or O and sets `playerSymbol`. The board is `disabled` when it is not the local player's turn or the game is over.

---

### Frontend — `Board.tsx`

A pure presentational component. Receives the 9-character `board` string (e.g. `"X.O......"`), splits it into individual cells, and renders a 3×3 CSS grid of `<button>` elements. Each button:
- Displays `X` or `O` (empty string for `.`)
- Is disabled if `disabled` prop is true or the cell is already occupied
- Calls `onMove(index)` on click

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Banner shows `⚠️ Offline Mode` | Docker not running | `docker compose up -d` |
| Games created but not visible | Module not published | `cd spacetimedb && spacetime publish --module-path . tictactoe` |
| `530 fatal error` on join_game | Duplicate primary key in players table | Re-publish the latest module (composite `id` fix) |
| `no such table: games` | Wrong table name in SQL | Table name = `accessor` value, not struct name |
| Bad WASM magic bytes `!<ar` | Missing `cdylib` crate type | Ensure `[lib] crate-type = ["cdylib"]` in Cargo.toml |
| `link.exe not found` | MSVC Build Tools not installed | Install from https://aka.ms/vs/17/release/vs_BuildTools.exe then restart terminal |
| `--project-path` flag unknown | Old CLI command | Use `--module-path` (v2 CLI rename) |
# tictactoe

