declare module '@spacetimedb/sdk' {
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

  export class DbConnection {
    constructor(url: string);
    close(): void;
    subscribe(table: string, callback: (rows: any[]) => void): void;
    call(method: string, args: any): Promise<void>;
    games(): { iter: () => Game[] };
    players(): { iter: () => Player[] };
    moves(): { iter: () => Move[] };
  }
}
