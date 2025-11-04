import { GameState } from '../../shared/types';
import { Injectable } from '@nestjs/common';

@Injectable()
export class GameStore {
  private games = new Map<string, GameState>();

  get(roomId: string): GameState | undefined {
    return this.games.get(roomId);
  }

  save(roomId: string, state: GameState): void {
    this.games.set(roomId, { ...state });
  }

  delete(roomId: string): void {
    this.games.delete(roomId);
  }

  getAll(): GameState[] {
    return Array.from(this.games.values());
  }
}
