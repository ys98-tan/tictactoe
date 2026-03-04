import { useEffect, useRef, useState } from "react";
import { DbConnection } from "./spacetimedb-client";
import Board from "./Board";

export default function App() {
  const [db, setDb] = useState<DbConnection | null>(null);
  const [playerId, setPlayerId] = useState<string>("");
  const [gameId, setGameId] = useState<string>("");
  const gameIdRef = useRef<string>("");
  const [currentGame, setCurrentGame] = useState<any>(null);
  const [playerSymbol, setPlayerSymbol] = useState<string>("");
  const [gameList, setGameList] = useState<any[]>([]);
  const [gameIdInput, setGameIdInput] = useState<string>("");
  const [isConnected, setIsConnected] = useState<boolean>(false);

  // Keep ref in sync with state so subscription callback always sees latest gameId
  const setGameIdBoth = (id: string) => {
    gameIdRef.current = id;
    setGameId(id);
  };

  // Initialize connection and player ID
  useEffect(() => {
    const pid = `player-${Math.random().toString(36).slice(2, 11)}`;
    setPlayerId(pid);

    // Connect to local SpacetimeDB (Docker) — pass base host only
    const conn = new DbConnection("ws://localhost:3001");
    setDb(conn);

    // Subscribe to games — use ref so the callback always sees the latest gameId
    conn.subscribe("games", (rows: any[]) => {
      setGameList(rows);
      const activeId = gameIdRef.current;
      if (activeId) {
        const game = rows.find((r) => r.game_id === activeId);
        setCurrentGame(game ?? null);
      }
    });

    // Check connection status periodically
    const statusInterval = setInterval(() => {
      setIsConnected(conn.isConnected());
    }, 1000);

    return () => {
      clearInterval(statusInterval);
      conn.close();
    };
  }, []);

  const createNewGame = async () => {
    if (!db) return;
    const newGameId = `game-${Date.now()}`;
    setGameIdBoth(newGameId);
    await db.call("create_game", { game_id: newGameId });
    await db.call("join_game", {
      game_id: newGameId,
      player_id: playerId,
    });
  };

  const joinExistingGame = async () => {
    if (!db || !gameIdInput) return;
    setGameIdBoth(gameIdInput);
    await db.call("join_game", {
      game_id: gameIdInput,
      player_id: playerId,
    });
  };

  const makeMove = async (position: number) => {
    if (!db || !currentGame) return;
    await db.call("make_move", {
      game_id: gameId,
      player_id: playerId,
      position,
    });
  };

  // Determine player's symbol
  useEffect(() => {
    if (currentGame) {
      if (currentGame.player_x === playerId) {
        setPlayerSymbol("X");
      } else if (currentGame.player_o === playerId) {
        setPlayerSymbol("O");
      }
    }
  }, [currentGame, playerId]);

  if (!currentGame) {
    return (
      <div style={{ padding: 20, fontFamily: "Arial, sans-serif" }}>
        <h1>🎮 Multiplayer Tic-Tac-Toe</h1>
        
        <div style={{ 
          padding: 10, 
          marginBottom: 20, 
          backgroundColor: isConnected ? '#d4edda' : '#fff3cd',
          borderLeft: `4px solid ${isConnected ? '#28a745' : '#ffc107'}`,
          borderRadius: 4
        }}>
          <p style={{ margin: 0 }}>
            {isConnected ? '✅ Connected' : '⚠️ Offline Mode'} - {isConnected ? 'Connected to SpacetimeDB' : 'Running games locally'}
          </p>
        </div>
        
        <p>Player ID: <code>{playerId}</code></p>

        <div style={{ marginBottom: 20 }}>
          <h2>Create New Game</h2>
          <button onClick={createNewGame} style={{ padding: 10, fontSize: 16 }}>
            Create Game
          </button>
        </div>

        <div style={{ marginBottom: 20 }}>
          <h2>Join Existing Game</h2>
          <input
            type="text"
            placeholder="Enter game ID"
            value={gameIdInput}
            onChange={(e) => setGameIdInput(e.target.value)}
            style={{ padding: 8, fontSize: 14, marginRight: 10 }}
          />
          <button onClick={joinExistingGame} style={{ padding: 10, fontSize: 16 }}>
            Join Game
          </button>
        </div>

        <div>
          <h2>Available Games</h2>
          {gameList.length === 0 ? (
            <p>No games available</p>
          ) : (
            <ul>
              {gameList.map((game) => (
                <li key={game.game_id}>
                  {game.game_id} - Players: {game.player_x ? "X" : "-"}/{game.player_o ? "O" : "-"}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }

  const isYourTurn = currentGame.turn === playerSymbol;
  const gameStatus =
    currentGame.winner === "DRAW"
      ? "🤝 Draw!"
      : currentGame.winner
      ? `🎉 ${currentGame.winner} Wins!`
      : `Current turn: ${currentGame.turn}`;

  return (
    <div style={{ padding: 20, fontFamily: "Arial, sans-serif" }}>
      <h1>🎮 Tic-Tac-Toe Game</h1>

      <div style={{ 
        padding: 10, 
        marginBottom: 20, 
        backgroundColor: isConnected ? '#d4edda' : '#fff3cd',
        borderLeft: `4px solid ${isConnected ? '#28a745' : '#ffc107'}`,
        borderRadius: 4,
        fontSize: 14
      }}>
        <p style={{ margin: 0 }}>
          {isConnected ? '✅ Connected' : '⚠️ Offline Mode'} - {isConnected ? 'Connected to SpacetimeDB' : 'Running games locally'}
        </p>
      </div>

      <div style={{ marginBottom: 20 }}>
        <p>
          Game ID: <code>{gameId}</code>
        </p>
        <p>
          You are playing as: <b>{playerSymbol}</b>
        </p>
        <p style={{ fontSize: 18, fontWeight: "bold" }}>{gameStatus}</p>
        {!currentGame.winner && (
          <p>{isYourTurn ? "✋ Your turn!" : "⏳ Waiting for opponent..."}</p>
        )}
      </div>

      <Board
        board={currentGame.board}
        onMove={makeMove}
        disabled={!isYourTurn || !!currentGame.winner}
      />

      {currentGame.winner && (
        <button
          onClick={createNewGame}
          style={{ marginTop: 20, padding: 10, fontSize: 16 }}
        >
          New Game
        </button>
      )}
    </div>
  );
}