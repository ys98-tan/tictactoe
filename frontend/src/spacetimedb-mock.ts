export class DbConnection {
  private url: string;
  private subscriptions: Map<string, (rows: any[]) => void> = new Map();
  private mockData: Record<string, any[]> = {};

  constructor(url: string) {
    this.url = url;
    console.log(`Connected to ${url}`);
  }

  subscribe(table: string, callback: (rows: any[]) => void) {
    this.subscriptions.set(table, callback);
    // Return mock data for games table
    if (table === 'games') {
      this.mockData['games'] = [
        {
          game_id: 'demo-game-1',
          board: '.........',
          turn: 'X',
          winner: null,
        },
      ];
      callback(this.mockData['games']);
    }
  }

  async call(method: string, args: any) {
    console.log(`Calling ${method}:`, args);

    if (method === 'create_game') {
      const game = {
        game_id: args.game_id,
        board: '.........',
        turn: 'X',
        winner: null,
      };
      this.mockData['games'] = [game];
      const callback = this.subscriptions.get('games');
      if (callback) callback([game]);
    } else if (method === 'make_move') {
      const games = this.mockData['games'] || [];
      const game = games.find((g: any) => g.game_id === args.game_id);
      if (game && game.winner === null && game.turn === args.player) {
        const board = game.board.split('');
        if (board[args.index] === '.') {
          board[args.index] = args.player;
          game.board = board.join('');
          game.turn = game.turn === 'X' ? 'O' : 'X';
          const callback = this.subscriptions.get('games');
          if (callback) callback([game]);
        }
      }
    }
  }

  close() {
    console.log('Connection closed');
  }
}
