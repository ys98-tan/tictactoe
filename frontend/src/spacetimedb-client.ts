/**
 * SpacetimeDB Client
 *
 * Speaks the real SpacetimeDB WebSocket protocol:
 *   - Subprotocol : v1.json.spacetimedb
 *   - Subscribe   : ws://HOST/v1/database/MODULE/subscribe
 *   - Reducers    : POST http://HOST/v1/database/MODULE/call/REDUCER
 *
 * Falls back to local (offline) game simulation when the server is unreachable.
 */

const MODULE_NAME = 'tictactoe';

// ---------------------------------------------------------------------------
// Public types (same shape the rest of the app already expects)
// ---------------------------------------------------------------------------

export interface Game {
  game_id: string;
  board: string;
  player_x: string | null;
  player_o: string | null;
  turn: string;
  winner: string | null;
  created_at: number;
}

export interface Player {
  player_id: string;
  game_id: string;
  symbol: string;
}

export interface Move {
  move_id: number;
  game_id: string;
  player_id: string;
  position: number;
  timestamp: number;
}

type SubscriptionCallback = (rows: any[]) => void;

// ---------------------------------------------------------------------------
// SATS-JSON helpers
// ---------------------------------------------------------------------------

/**
 * Decode a SATS sum-type Option<String>.
 *
 * SpacetimeDB v2 actual wire format (array discriminant):
 *   Some("x")  →  [0, "x"]
 *   None        →  [1, {}] or [1, []]
 *
 * Also handles plain null/string for robustness.
 */
function decodeSATSOption(val: unknown): string | null {
  if (val === null || val === undefined) return null;
  if (typeof val === 'string') return val;
  if (Array.isArray(val)) {
    // [0, value] = Some(value), [1, ...] = None
    if (val[0] === 0 && val.length >= 2 && val[1] != null) return String(val[1]);
    return null;
  }
  return null;
}

/**
 * Parse a Game row from SATS-JSON.
 * Handles both positional-array form and named-object form.
 *
 * Positional column order from lib.rs Game struct:
 *   [0] game_id  [1] board  [2] player_x  [3] player_o
 *   [4] turn     [5] winner [6] created_at
 */
function parseGameRow(row: unknown): Game {
  if (Array.isArray(row)) {
    return {
      game_id:    String(row[0]),
      board:      String(row[1]),
      player_x:   decodeSATSOption(row[2]),
      player_o:   decodeSATSOption(row[3]),
      turn:       String(row[4]),
      winner:     decodeSATSOption(row[5]),
      created_at: Number(row[6]),
    };
  }
  const r = row as Record<string, unknown>;
  return {
    game_id:    String(r.game_id),
    board:      String(r.board),
    player_x:   decodeSATSOption(r.player_x),
    player_o:   decodeSATSOption(r.player_o),
    turn:       String(r.turn),
    winner:     decodeSATSOption(r.winner),
    created_at: Number(r.created_at),
  };
}

// ---------------------------------------------------------------------------
// Reducer argument ordering
// SpacetimeDB HTTP reducer calls receive args as a positional JSON array.
// The first param of every reducer is ReducerContext (server-injected), so we
// skip it and list only the client-supplied params in declaration order.
// ---------------------------------------------------------------------------

const REDUCER_ARG_ORDER: Record<string, string[]> = {
  create_game: ['game_id'],
  join_game:   ['game_id', 'player_id'],
  make_move:   ['game_id', 'player_id', 'position'],
};

function argsToArray(method: string, args: Record<string, unknown>): unknown[] {
  const order = REDUCER_ARG_ORDER[method];
  if (!order) return Object.values(args);
  return order.map(key => args[key]);
}

// ---------------------------------------------------------------------------
// Offline local state (used when connection fails)
// ---------------------------------------------------------------------------

class LocalGameState {
  games:   Game[]   = [];
  players: Player[] = [];
  moves:   Move[]   = [];

  getGames() { return [...this.games]; }

  upsertGame(game: Game) {
    const idx = this.games.findIndex(g => g.game_id === game.game_id);
    if (idx >= 0) this.games[idx] = game; else this.games.push(game);
  }
}

const localState = new LocalGameState();

// ---------------------------------------------------------------------------
// DbConnection
// ---------------------------------------------------------------------------

export class DbConnection {
  private wsUrl:   string;
  private httpUrl: string;
  private socket:  WebSocket | null = null;
  private subscriptions: Map<string, SubscriptionCallback[]> = new Map();
  private gameCache: Map<string, Game> = new Map();
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;

  /**
   * @param url  Base WebSocket URL, e.g. "ws://localhost:3001"
   *             (just the host + port — paths are constructed internally)
   */
  constructor(url: string) {
    // Accept either a bare host ("ws://host:port") or a full subscribe URL
    // (backwards compat with the previous ws://…/database/subscribe/tictactoe)
    const wsProto   = url.startsWith('wss://') ? 'wss' : 'ws';
    const httpProto = wsProto === 'wss' ? 'https' : 'http';
    const host      = url
      .replace(/^wss?:\/\//, '')
      .replace(/\/.*$/, '');   // strip any path

    this.wsUrl   = `${wsProto}://${host}/v1/database/${MODULE_NAME}/subscribe`;
    this.httpUrl = `${httpProto}://${host}/v1/database/${MODULE_NAME}`;
    this.connect();
  }

  // -------------------------------------------------------------------------
  // WebSocket lifecycle
  // -------------------------------------------------------------------------

  private connect() {
    try {
      // Request the JSON-encoded subprotocol so row data arrives as plain JSON
      this.socket = new WebSocket(this.wsUrl, ['v1.json.spacetimedb']);

      this.socket.addEventListener('open', () => {
        console.log('✅ Connected to SpacetimeDB at', this.wsUrl);
        this.reconnectAttempts = 0;
        this.sendSubscribe();
      });

      this.socket.addEventListener('message', event => {
        try {
          this.handleMessage(JSON.parse(event.data as string));
        } catch (e) {
          console.warn('⚠️ Failed to parse WS message:', e);
        }
      });

      this.socket.addEventListener('error', event => {
        console.error('❌ WebSocket error:', event);
      });

      this.socket.addEventListener('close', () => {
        console.warn('⚠️ Disconnected from SpacetimeDB');
        this.attemptReconnect();
      });
    } catch (err) {
      console.error('Failed to create WebSocket:', err);
      this.attemptReconnect();
    }
  }

  private sendSubscribe() {
    if (this.socket?.readyState !== WebSocket.OPEN) return;
    // Subscribe to all three tables with raw SQL
    this.socket.send(JSON.stringify({
      Subscribe: {
        query_strings: [
          'SELECT * FROM games',
          'SELECT * FROM players',
          'SELECT * FROM moves',
        ],
        request_id: 0,
      },
    }));
    console.log('📡 Sent Subscribe for Game, Player, Move');
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnect attempts reached — offline mode active');
      return;
    }
    this.reconnectAttempts++;
    const delay = Math.min(1000 * 2 ** (this.reconnectAttempts - 1), 30_000);
    console.log(`🔄 Reconnecting in ${delay}ms (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    setTimeout(() => this.connect(), delay);
  }

  // -------------------------------------------------------------------------
  // Incoming message dispatch
  // -------------------------------------------------------------------------

  private handleMessage(msg: Record<string, unknown>) {
    console.log('📨 SpacetimeDB:', JSON.stringify(msg).slice(0, 300));

    // Identity token sent on initial connection
    if (msg.IdentityToken) return;

    // Initial data after Subscribe
    if (msg.SubscribeApplied) {
      const payload = msg.SubscribeApplied as Record<string, unknown>;
      // Per-query response has a single "table" key
      if (payload.table) this.applyTableUpdate(payload.table);
      // Batch response has "database_update.tables"
      const tables = (payload.database_update as any)?.tables;
      if (Array.isArray(tables)) tables.forEach(t => this.applyTableUpdate(t));
      return;
    }

    // Older server variant
    if (msg.InitialSubscription) {
      const tables = (msg.InitialSubscription as any)?.database_update?.tables;
      if (Array.isArray(tables)) tables.forEach(t => this.applyTableUpdate(t));
      return;
    }

    // Real-time updates after a reducer runs
    if (msg.TransactionUpdateLight || msg.TransactionUpdate) {
      const tx = (msg.TransactionUpdateLight ?? msg.TransactionUpdate) as Record<string, unknown>;
      // v2: TransactionUpdateLight → { update: { tables: [...] } }
      // v2: TransactionUpdate      → { status: { Committed: { tables: [...] } } } | { subscription_update: ... }
      const tables: unknown[] =
        (tx.update as any)?.tables ??
        (tx.status as any)?.Committed?.tables ??
        (tx.subscription_update as any)?.tables ??
        [];
      tables.forEach(t => this.applyTableUpdate(t));
      return;
    }
  }

  private applyTableUpdate(table: unknown) {
    if (!table || typeof table !== 'object') return;
    const t = table as Record<string, unknown>;
    if (!t.table_name) return;

    // v2: t.updates is an array of { deletes: string[], inserts: string[] }
    //     Each row is a JSON-encoded string that must be parsed.
    let rawInserts: unknown[] = [];
    let rawDeletes: unknown[] = [];
    if (Array.isArray(t.updates)) {
      for (const upd of t.updates as Array<{deletes?: unknown[], inserts?: unknown[]}>) {
        rawInserts = rawInserts.concat(upd.inserts ?? []);
        rawDeletes = rawDeletes.concat(upd.deletes ?? []);
      }
    } else {
      // Fallback for older shape
      const updates = t.updates as Record<string, unknown> | undefined;
      rawInserts = (updates?.inserts ?? t.inserts ?? []) as unknown[];
      rawDeletes = (updates?.deletes ?? t.deletes ?? []) as unknown[];
    }

    // Rows arrive as JSON strings — parse them
    const inserts = rawInserts.map(r => typeof r === 'string' ? JSON.parse(r) : r);
    const deletes = rawDeletes.map(r => typeof r === 'string' ? JSON.parse(r) : r);

    if (t.table_name === 'games') {
      for (const row of deletes) {
        const game = parseGameRow(row);
        this.gameCache.delete(game.game_id);
      }
      for (const row of inserts) {
        const game = parseGameRow(row);
        this.gameCache.set(game.game_id, game);
        localState.upsertGame(game);
      }
      this.notifySubscribers('games', [...this.gameCache.values()]);
    }
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  subscribe(table: string, callback: SubscriptionCallback): void {
    if (!this.subscriptions.has(table)) this.subscriptions.set(table, []);
    this.subscriptions.get(table)!.push(callback);
    // Immediately deliver whatever is cached (empty array on first call)
    if (table === 'games') callback([...this.gameCache.values()]);
  }

  async call(method: string, args: Record<string, unknown>): Promise<void> {
    if (!this.isConnected()) {
      console.warn('⚠️ Offline — running reducer locally');
      this.simulateReducerLocally(method, args);
      return;
    }
    try {
      const resp = await fetch(`${this.httpUrl}/call/${method}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(argsToArray(method, args)),
      });
      if (!resp.ok) throw new Error(`${resp.status} ${await resp.text()}`);
      console.log(`✅ Reducer "${method}" OK`);
    } catch (err) {
      console.error(`❌ Reducer "${method}" failed:`, err);
      this.simulateReducerLocally(method, args);
    }
  }

  isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }

  close(): void {
    this.socket?.close();
    console.log('🔌 Connection closed');
  }

  // -------------------------------------------------------------------------
  // Offline / local simulation (unchanged game logic)
  // -------------------------------------------------------------------------

  private notifySubscribers(table: string, data: unknown[]) {
    this.subscriptions.get(table)?.forEach(cb => {
      try { cb(data as any[]); } catch (e) { console.error('Callback error:', e); }
    });
  }

  private simulateReducerLocally(method: string, args: Record<string, unknown>) {
    console.log(`⚡ [Local] ${method}`, args);

    if (method === 'create_game') {
      const game: Game = {
        game_id:    String(args.game_id),
        board:      '.........',
        player_x:   null,
        player_o:   null,
        turn:       'X',
        winner:     null,
        created_at: Date.now(),
      };
      this.gameCache.set(game.game_id, game);
      localState.upsertGame(game);
      this.notifySubscribers('games', [...this.gameCache.values()]);

    } else if (method === 'join_game') {
      const game = this.gameCache.get(String(args.game_id));
      if (!game) return;
      if (!game.player_x)      game.player_x = String(args.player_id);
      else if (!game.player_o) game.player_o = String(args.player_id);
      this.gameCache.set(game.game_id, game);
      localState.upsertGame(game);
      this.notifySubscribers('games', [...this.gameCache.values()]);

    } else if (method === 'make_move') {
      const game = this.gameCache.get(String(args.game_id));
      if (!game || game.winner) return;
      const pos   = Number(args.position);
      const board = game.board.split('');
      if (board[pos] !== '.') return;
      const symbol = game.player_x === String(args.player_id) ? 'X' : 'O';
      if (game.turn !== symbol) return;
      board[pos]  = symbol;
      game.board  = board.join('');
      game.winner = this.checkWinner(game.board);
      if (!game.winner) game.turn = symbol === 'X' ? 'O' : 'X';
      this.gameCache.set(game.game_id, game);
      localState.upsertGame(game);
      this.notifySubscribers('games', [...this.gameCache.values()]);
    }
  }

  private checkWinner(board: string): string | null {
    const c = board.split('');
    const lines = [
      [0,1,2],[3,4,5],[6,7,8],
      [0,3,6],[1,4,7],[2,5,8],
      [0,4,8],[2,4,6],
    ];
    for (const [a,b,d] of lines) {
      if (c[a] !== '.' && c[a] === c[b] && c[b] === c[d]) return c[a];
    }
    return c.every(x => x !== '.') ? 'DRAW' : null;
  }
}
