# Implementation Details: Multiplayer Tic-Tac-Toe with SpacetimeDB

## How It All Works Together

### Data Flow Diagram

```
Client (Browser)              Network              SpacetimeDB Backend
├─ App.tsx                    │      WebSocket     └─ lib.rs
├─ Board.tsx          call    │     │───────────►  ├─ Tables:
└─ main.tsx  "make_move"      │     │              │   ├─ Game
  │                           │     │              │   ├─ Player
  │  subscribe("games")       │     │              │   └─ Move
  └──────────────────────────►│◄────┤  Real-time   │
                              │     └──────────────┤─ Reducers:
                              │                    │   ├─ create_game()
                              │◄───────────────────┤   ├─ join_game()
                              │   Broadcast update │   └─ make_move()
                              │                    │
                              │ Both clients       │ Server-side
                              │ receive same       │ validates all
                              │ game state         │ moves & logic
```

## The Three Tables

### 1. **games** Table
Stores the current state of each Tic-Tac-Toe game.

Field | Type | Meaning
------|------|--------
`game_id` | String | Unique identifier (primary key)
`board` | String | 9-character board state ("X O....")
`player_x` | Option<String> | Player ID who plays X (if any)
`player_o` | Option<String> | Player ID who plays O (if any)
`turn` | String | "X" or "O" - whose turn is it?
`winner` | Option<String> | "X", "O", "DRAW", or None
`created_at` | u64 | Unix timestamp

Example record:
```rust
Game {
  game_id: "game-1688234567890",
  board: "XO.......",
  player_x: Some("player-abc123"),
  player_o: Some("player-def456"),
  turn: "O",
  winner: None,
  created_at: 1688234567890,
}
```

### 2. **players** Table
Tracks which players are in which games and what symbol they play as.

Field | Type | Meaning
------|------|--------
`player_id` | String | Player's unique ID (primary key)
`game_id` | String | Which game they're in
`symbol` | String | "X" or "O"

Example:
```rust
Player {
  player_id: "player-abc123",
  game_id: "game-1688234567890",
  symbol: "X",
}
```

### 3. **moves** Table
Immutable log of every move ever made. Used for replays, analysis, or debugging.

Field | Type | Meaning
------|------|--------
`move_id` | u64 | Unique sequence number
`game_id` | String | Which game
`player_id` | String | Who played
`position` | u8 | Board position (0-8)
`timestamp` | u64 | When they played

Example:
```rust
Move {
  move_id: 1,
  game_id: "game-1688234567890",
  player_id: "player-abc123",
  position: 4,  // Center square
  timestamp: 1688234570000,
}
```

## The Three Reducers (Operations)

### 1. `create_game(game_id: String)`

**What it does:** Creates a new game.

**Steps:**
1. Check if game already exists (idempotent)
2. Create new Game record with:
   - Empty board (".........")
   - No players yet
   - X's turn first
   - No winner

**Example call:**
```typescript
await db.call("create_game", { 
  game_id: "game-1688234567890" 
});
```

**After execution:**
- Database has new Game record
- All subscribed clients see it immediately
- Game is ready for players to join

### 2. `join_game(game_id: String, player_id: String)`

**What it does:** Adds a player to a game.

**Steps:**
1. Find the game (return if not found)
2. Validate game isn't over
3. Assign player to X if empty, O if X is taken
4. Add Player record
5. Update Game record

**Example call:**
```typescript
await db.call("join_game", {
  game_id: "game-1688234567890",
  player_id: "player-abc123"
});
```

**After execution:**
- Player is assigned to X or O
- Both players see the updated game
- Game is ready to play (if both players present)

**Validations:**
- ✅ Game exists
- ✅ Game isn't over
- ✅ Spot available (X or O)
- ❌ Game already has 2 players

### 3. `make_move(game_id, player_id, position)`

**What it does:** Plays a move, validates it, updates game state.

**Steps:**
1. Validate position is 0-8
2. Find game
3. Check game isn't over
4. Determine player's symbol (X or O)
5. Validate it's their turn
6. Check cell is empty
7. Update board
8. Check for winner
9. Switch turns (if no winner)
10. Record move in moves table
11. Update game record

**Example call:**
```typescript
await db.call("make_move", {
  game_id: "game-1688234567890",
  player_id: "player-abc123",
  position: 4  // Center square
});
```

**After execution:**
- Board is updated
- Turn switches (or game ends if winner)
- Both players see new state
- Move logged in moves table

**Validations:**
- ✅ Position is 0-8
- ✅ Game exists
- ✅ Game isn't over
- ✅ Player is in the game
- ✅ It's their turn
- ✅ Cell is empty
- ❌ Invalid position
- ❌ Cell already occupied
- ❌ Wrong player's turn
- ❌ Game already won

## Win Condition Detection

The `check_winner()` function checks 8 patterns:

```
Rows:        Columns:      Diagonals:
0 1 2        0 3 6         0 4 8
3 4 5   or   1 4 7   or    2 4 6
6 7 8        2 5 8
```

**Example:** Board "XXO O     " (player X wins)
```
X | X | O
---------
O | X |
---------
  |   |

Three in a row horizontally (0, 1, 2)
```

**Draw detection:** All 9 cells filled, no winner

## Real-Time Synchronization

### How Subscriptions Work

Client subscribes to a table:
```typescript
db.subscribe("games", (games) => {
  setGameList(games); // Update when ANY game changes
});
```

SpacetimeDB mechanism:
```
Client: "Tell me when games table changes"
Server: ✓ Added to subscribers list
Client: Makes a move
Server: Updates game record
Server: Broadcasts to all subscribers
Clients: Receive updated game instantly
```

**No polling, no caching issues, no sync problems.**

## Turn-Based Game Loop

### Complete Game Sequence

```
1. Player A creates game
   ├─ Calls create_game("game-123")
   └─ Game created, waiting for player 2

2. Player B joins game
   ├─ Calls join_game("game-123", "player-b")
   ├─ Player B assigned as "O"
   ├─ Both see game with 2 players
   └─ Game state: X's turn (A plays first)

3. Player A makes move (position 4 - center)
   ├─ Calls make_move("game-123", "player-a", 4)
   ├─ Validated: It's A's turn, cell empty, game active
   ├─ Board: "....X...."
   ├─ Both see updated board: "X's turn → O's turn"
   └─ Move logged: {move_id: 1, player: A, position: 4}

4. Player B makes move (position 0)
   ├─ Calls make_move("game-123", "player-b", 0)
   ├─ Validated: It's B's turn, cell empty, game active
   ├─ Board: "O...X...."
   ├─ Both see updated board: "X's turn → O's turn"
   └─ Move logged: {move_id: 2, player: B, position: 0}

5. Continue until...

6. Player A wins! (completes three in a row)
   ├─ Calls make_move("game-123", "player-a", 8)
   ├─ Board: "O...X...X"
   ├─ check_winner() detects: 2, 4, 6 diagonal (all X)
   ├─ winner = "X"
   ├─ Both see: "Winner: X" (A's symbol)
   ├─ Game ends (no more moves accepted)
   └─ Move logged: {move_id: 5, player: A, position: 8}

7. Players can play again
   ├─ Click "New Game"
   └─ Back to step 1
```

## Board Representation

The board is a 9-character string:
```
Position:  0 1 2
           3 4 5
           6 7 8

Example:   X O .
           . X .
           . . O

Stored as: "XO...X...O"  (just concatenated)

Always checked before move:
board[position] != '.'  // Is cell empty?
```

## Key Design Decisions

### Why Rust?
- **Type safety**: Compiler catches errors at build time
- **Performance**: No garbage collection, minimal overhead
- **Correctness**: Game logic can't be bypassed
- **Easy deployment**: Single binary

### Why SpacetimeDB?
- **No separate backend needed**: Database IS the server
- **Real-time by default**: All clients see updates instantly
- **Atomic operations**: Moves are validated and applied atomically
- **Replay capability**: All moves logged for analysis
- **No DevOps overhead**: Publish once, it scales

### Why React?
- **Real-time UI**: Subscribe to changes, UI updates automatically
- **Component reusability**: Board, App can be extended
- **Developer experience**: Hot reload, good tooling

## Performance Characteristics

Operation | Time Complexity | Details
-----------|-----------------|--------
Create game | O(1) | Single insert
Join game | O(g) | Linear search in games table
Make move | O(g + m) | Game lookup + move insert
Subscribe | O(1) | Database triggers automatically
Broadcast | O(1) | WebSocket to all subscribers

**Typical latencies:**
- Same datacenter: < 10ms
- Same region: < 50ms
- Across world: < 200ms

## Security & Validation

All validation happens server-side in Rust:

```rust
// Never trust client - validate everything

// Position bounds
if position >= 9 { return; }

// Game exists
if game.is_none() { return; }

// Player authorized
if !game.contains_player(player_id) { return; }

// Valid turn
if game.turn != player_symbol { return; }

// Cell available
if board[position] != '.' { return; }

// Game active
if game.winner.is_some() { return; }
```

## Extensibility

### Easy to add:
- **Chat**: New `messages` table + `send_message` reducer
- **Leaderboards**: Add `wins`, `losses` fields, new table
- **Game variants**: Use game_type field
- **Time limits**: Track move timestamps
- **Spectators**: New spectators table + subscription

### Hard to add:
- Decentralized consensus (requires blockchain)
- Peer-to-peer (need coordination layer)
- Offline play (would need local database)

SpacetimeDB is ideal for server-backed turn-based games.

---

**This implementation shows how SpacetimeDB eliminates the complexity of building a multiplayer backend while maintaining complete server-side validation and real-time synchronization.**
