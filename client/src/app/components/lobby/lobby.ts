import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { GameService } from '../../services/game.service';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-lobby',
  templateUrl: './lobby.html',
  imports: [
    FormsModule
  ],
  styleUrls: ['./lobby.css']
})
export class LobbyComponent {
  roomId: string = '';
  playerId: string = '';
  playerName: string = '';

  constructor(
    private gameService: GameService,
    private router: Router
  ) {
    this.playerId = 'p' + Math.random().toString(36).substr(2, 9);
  }

  joinGame(): void {
    if (!this.roomId || !this.playerName) {
      alert('Please enter room ID and your name');
      return;
    }

    this.gameService.connect();
    this.gameService.joinGame(this.roomId, this.playerId, this.playerName);

    this.router.navigate(['/game', this.roomId]);
  }

  createRoom(): void {
    // Generate random room ID
    this.roomId = 'room' + Math.random().toString(36).substr(2, 6);
  }
}
