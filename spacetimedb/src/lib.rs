use spacetimedb::{table, reducer, ReducerContext, Table};

/// =========================
/// Game Table
/// =========================
#[table(accessor = games, public)]
pub struct Game {
    #[primary_key]
    pub game_id: String,

    pub board: String,            // "........."
    pub player_x: Option<String>,
    pub player_o: Option<String>,
    pub turn: String,             // "X" or "O"
    pub winner: Option<String>,   // "X", "O", or "DRAW"
    pub created_at: u64,
}

/// =========================
/// Player Table
/// =========================
#[table(accessor = players, public)]
pub struct Player {
    #[primary_key]
    pub id: String, // composite: "{game_id}:{player_id}"

    pub game_id: String,
    pub player_id: String,
    pub symbol: String, // "X" or "O"
}

/// =========================
/// Move History Table
/// =========================
#[table(accessor = moves, public)]
pub struct Move {
    #[primary_key]
    #[auto_inc]
    pub move_id: u64,

    pub game_id: String,
    pub player_id: String,
    pub position: u8,
    pub timestamp: u64,
}

/// =========================
/// Helper: Check Winner
/// =========================
fn check_winner(board: &str) -> Option<String> {
    let cells: Vec<char> = board.chars().collect();

    let wins = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
        [0, 4, 8], [2, 4, 6],            // diagonals
    ];

    for win in wins {
        let a = cells[win[0]];
        let b = cells[win[1]];
        let c = cells[win[2]];

        if a != '.' && a == b && b == c {
            return Some(a.to_string());
        }
    }

    // Draw
    if cells.iter().all(|&c| c != '.') {
        return Some("DRAW".to_string());
    }

    None
}

/// =========================
/// Reducer: Create Game
/// =========================
#[reducer]
pub fn create_game(ctx: &ReducerContext, game_id: String) {
    if ctx.db.games().game_id().find(&game_id).is_some() {
        return;
    }

    ctx.db.games().insert(Game {
        game_id,
        board: ".........".to_string(),
        player_x: None,
        player_o: None,
        turn: "X".to_string(),
        winner: None,
        created_at: ctx.timestamp.to_micros_since_unix_epoch() as u64,
    });
}

/// =========================
/// Reducer: Join Game
/// =========================
#[reducer]
pub fn join_game(ctx: &ReducerContext, game_id: String, player_id: String) {
    let Some(mut game) = ctx.db.games().game_id().find(&game_id) else {
        return;
    };

    if game.winner.is_some() {
        return;
    }

    if game.player_x.as_deref() == Some(&player_id)
        || game.player_o.as_deref() == Some(&player_id)
    {
        return;
    }

    let symbol = if game.player_x.is_none() {
        game.player_x = Some(player_id.clone());
        "X".to_string()
    } else if game.player_o.is_none() {
        game.player_o = Some(player_id.clone());
        "O".to_string()
    } else {
        return;
    };

    ctx.db.players().insert(Player {
        id: format!("{}:{}", game_id, player_id),
        game_id: game_id.clone(),
        player_id: player_id.clone(),
        symbol: symbol.clone(),
    });

    ctx.db.games().game_id().update(game);
}

/// =========================
/// Reducer: Make Move
/// =========================
#[reducer]
pub fn make_move(
    ctx: &ReducerContext,
    game_id: String,
    player_id: String,
    position: u8,
) {
    if position >= 9 {
        return;
    }

    let Some(mut game) = ctx.db.games().game_id().find(&game_id) else {
        return;
    };

    if game.winner.is_some() {
        return;
    }

    let symbol = if game.player_x.as_deref() == Some(&player_id) {
        "X"
    } else if game.player_o.as_deref() == Some(&player_id) {
        "O"
    } else {
        return;
    };

    if game.turn != symbol {
        return;
    }

    let mut board: Vec<char> = game.board.chars().collect();
    let pos = position as usize;

    if board[pos] != '.' {
        return;
    }

    board[pos] = symbol.chars().next().unwrap();
    game.board = board.into_iter().collect();

    if let Some(result) = check_winner(&game.board) {
        game.winner = Some(result);
    } else {
        game.turn = if symbol == "X" { "O".to_string() } else { "X".to_string() };
    }

    ctx.db.moves().insert(Move {
        move_id: 0,
        game_id: game_id.clone(),
        player_id,
        position,
        timestamp: ctx.timestamp.to_micros_since_unix_epoch() as u64,
    });

    ctx.db.games().game_id().update(game);
}