import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { GameState, Player, Card } from '../models/game.types';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket;
  private readonly SERVER_URL = 'http://localhost:5000';

  constructor() {
    this.socket = io(this.SERVER_URL, {
      transports: ['websocket'],
      autoConnect: false
    });
  }

  connect(): void {
    if (!this.socket.connected) {
      this.socket.connect();
    }
  }

  // Emit events
  joinRoom(roomId: string, player: Player): void {
    this.socket.emit('join', { roomId, player });
  }

  startGame(roomId: string): void {
    this.socket.emit('start', { roomId });
  }

  playCard(roomId: string, playerId: string, card: Card, color?: string): void {
    this.socket.emit('play', { roomId, playerId, card, color });
  }

  drawCard(roomId: string, playerId: string): void {
    this.socket.emit('draw', { roomId, playerId });
  }

  emitUnoYell(roomId: string, playerId: string) {
    this.socket.emit('yell_uno', { roomId, playerId });
  }

  // Listen to events
  onGameState(): Observable<GameState> {
    return new Observable(observer => {
      this.socket.on('state', (state: GameState) => {
        observer.next(state);
      });
    });
  }

  onError(): Observable<{ message: string }> {
    return new Observable(observer => {
      this.socket.on('error', (error: { message: string }) => {
        observer.next(error);
      });
    });
  }

  onUnoCalled(): Observable<{ playerId: string }> {
    return new Observable(observer => {
      this.socket.on('uno_called', (data: { playerId: string }) => observer.next(data));
    });
  }

  onUnoPenalty(): Observable<{ playerId: string }> {
    return new Observable(observer => {
      this.socket.on('uno_penalty', (data: { playerId: string }) => observer.next(data));
    });
  }

}
