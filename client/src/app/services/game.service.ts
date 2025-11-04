import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SocketService } from './socket.service';
import { GameState, Player, Card } from '../models/game.types';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private gameStateSubject = new BehaviorSubject<GameState | null>(null);
  public gameState$: Observable<GameState | null> = this.gameStateSubject.asObservable();

  private currentPlayerSubject = new BehaviorSubject<Player | null>(null);
  public currentPlayer$: Observable<Player | null> = this.currentPlayerSubject.asObservable();

  private errorSubject = new BehaviorSubject<string | null>(null);
  public error$: Observable<string | null> = this.errorSubject.asObservable();

  constructor(private socketService: SocketService) {
    this.initializeSocketListeners();
  }

  private initializeSocketListeners(): void {
    this.socketService.onGameState().subscribe(state => {
      this.gameStateSubject.next(state);
    });

    this.socketService.onError().subscribe(error => {
      this.errorSubject.next(error.message);
      setTimeout(() => this.errorSubject.next(null), 5000);
    });
  }

  connect(): void {
    this.socketService.connect();
  }

  disconnect(): void {
    this.socketService.disconnect();
  }

  joinGame(roomId: string, playerId: string, playerName: string): void {
    const player: Player = {
      id: playerId,
      name: playerName,
      hand: []
    };
    this.currentPlayerSubject.next(player);
    this.socketService.joinRoom(roomId, player);
  }

  startGame(roomId: string): void {
    this.socketService.startGame(roomId);
  }

  playCard(roomId: string, playerId: string, card: Card, color?: string): void {
    this.socketService.playCard(roomId, playerId, card, color);
  }

  drawCard(roomId: string, playerId: string): void {
    this.socketService.drawCard(roomId, playerId);
  }

  getCurrentGameState(): GameState | null {
    return this.gameStateSubject.value;
  }

  getCurrentPlayer(): Player | null {
    return this.currentPlayerSubject.value;
  }

  isMyTurn(): boolean {
    const state = this.gameStateSubject.value;
    const player = this.currentPlayerSubject.value;

    if (!state || !player || !state.isActive) {
      return false;
    }

    const currentPlayer = state.players[state.currentPlayerIndex];
    return currentPlayer?.id === player.id;
  }

  getMyHand(): Card[] {
    const state = this.gameStateSubject.value;
    const player = this.currentPlayerSubject.value;

    if (!state || !player) {
      return [];
    }

    const myPlayer = state.players.find(p => p.id === player.id);
    return myPlayer?.hand || [];
  }
}
