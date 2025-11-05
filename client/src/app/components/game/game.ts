import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { GameService } from '../../services/game.service';
import { GameState, Card } from '../../models/game.types';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-game',
  templateUrl: './game.html',
  styleUrls: ['./game.css']
})
export class GameComponent implements OnInit, OnDestroy {
  gameState: GameState | null = null;
  roomId: string = '';
  error: string | null = null;
  showColorPicker: boolean = false;
  selectedCard: Card | null = null;

  private subscriptions: Subscription[] = [];

  unoButtonVisible: boolean = false;
  private unoTimeout: any;
  private hasYelledUno: boolean = false;

  constructor(
    private gameService: GameService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.roomId = this.route.snapshot.paramMap.get('roomId')?.toUpperCase() || '';

    this.subscriptions.push(
      this.gameService.gameState$.subscribe(state => {
        const previousHandSize = this.gameState ? this.getMyHand().length : 0;
        this.gameState = state;
        const myHand = this.getMyHand();

        if (myHand.length !== 1) {
          this.hasYelledUno = false;
          if (this.unoButtonVisible) {
            this.unoButtonVisible = false;
            clearTimeout(this.unoTimeout);
          }
        }

        if (myHand.length === 1 && !this.unoButtonVisible && !this.hasYelledUno) {
          this.showUnoButtonTemporarily();
        }
      })
    );

    this.subscriptions.push(
      this.gameService.error$.subscribe(error => {
        this.error = error;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  startGame(): void {
    this.gameService.startGame(this.roomId);
  }

  onCardClick(card: Card): void {
    if (!this.isMyTurn()) return;

    if (card.color === 'wild') {
      this.selectedCard = card;
      this.showColorPicker = true;
    } else {
      this.playCard(card);
    }
  }

  copyCode() {
    navigator.clipboard.writeText(this.roomId);
  }

  showUnoButtonTemporarily(): void {
    this.unoButtonVisible = true;
    clearTimeout(this.unoTimeout);
    this.unoTimeout = setTimeout(() => {
      this.unoButtonVisible = false;
    }, 5000);
  }

  yellUno(): void {
    this.unoButtonVisible = false;
    this.hasYelledUno = true;
    clearTimeout(this.unoTimeout);

    const player = this.gameService.getCurrentPlayer();
    if (!player) return;
    this.gameService.yellUno(this.roomId, player.id);
  }

  playCard(card: Card, color?: string): void {
    const player = this.gameService.getCurrentPlayer();
    if (!player) return;

    this.gameService.playCard(this.roomId, player.id, card, color);
    this.showColorPicker = false;
    this.selectedCard = null;
  }

  onColorSelect(color: string): void {
    if (this.selectedCard) {
      this.playCard(this.selectedCard, color);
    }
  }

  drawCard(): void {
    const player = this.gameService.getCurrentPlayer();
    if (!player) return;
    if(!this.isMyTurn()) return;

    this.gameService.drawCard(this.roomId, player.id);
  }

  isMyTurn(): boolean {
    return this.gameService.isMyTurn();
  }

  getMyHand(): Card[] {
    return this.gameService.getMyHand();
  }

  getCardImage(card: Card): string {
    return `assets/cards/${card.imageId}.png`;
  }

  canPlayCard(card: Card): boolean {
    if (!this.gameState || !this.isMyTurn()) {
      return false;
    }

    const topCard = this.gameState.currentCard;
    const currentColor = this.gameState.currentColor;

    if (!topCard || !currentColor) {
      return false;
    }

    return (
      card.color === currentColor ||
      (card.type === 'number' && topCard.type === 'number' && card.value === topCard.value) ||
      card.type !== 'number' && topCard.type !== 'number' && card.type === topCard.type ||
      card.color === 'wild'
    );
  }

  getActiveColor(color: string): string {
    return "color-indicator " + color;
  }

  getMyPlayerName(): string {
    const currentPlayer = this.gameService.getCurrentPlayer();
    return currentPlayer?.name || 'Player';
  }

  isMe(playerId: string): boolean {
    const currentPlayer = this.gameService.getCurrentPlayer();
    return currentPlayer?.id === playerId;
  }

  getCardBacksArray(count: number): any[] {
    return Array(count).fill(null);
  }

  isGameOver(): boolean {
    return (
      !!this.gameState && !this.gameState.isActive && this.gameState.players.some((player) => player.hand.length === 0) && this.gameState.deck.length !== 107
    )
  }

  getWinner(): string {
    return this.gameState?.players.find(p => p.hand.length === 0)?.name || 'Unknown Player'
  }
}
