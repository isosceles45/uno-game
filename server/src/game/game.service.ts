import { Injectable } from '@nestjs/common';
import { GameStore } from './store/store';
import { Deck } from './deck/deck.service';
import { Card, GameState, Player } from '../shared/types';

@Injectable()
export class GameService {
  constructor(
    private readonly store: GameStore,
    private readonly deckHelper: Deck,
  ) {}

  private stackDraw(state: GameState, count: number): void {
    const nextIdx =
      (state.currentPlayerIndex + state.direction + state.players.length) %
      state.players.length;
    const nextPlayer = state.players[nextIdx];
    const [drawn, remaining] = this.deckHelper.draw(state.deck, count);
    nextPlayer.hand.push(...drawn);
    state.deck = remaining;
    this.nextTurn(state);
  }

  nextTurn(state: GameState): void {
    const len = state.players.length;
    state.currentPlayerIndex =
      (state.currentPlayerIndex + state.direction + len) % len;
  }

  validatePlay(card: Card, topCard: Card, currentColor: string): boolean {
    return (
      card.color === currentColor ||
      (card.type === 'number' &&
        topCard.type === 'number' &&
        card.value === topCard.value) ||
      (card.type !== 'number' &&
        topCard.type !== 'number' &&
        card.type === topCard.type) ||
      card.color === 'wild'
    );
  }

  applyCardEffect(state: GameState, card: Card): void {
    switch (card.type) {
      case 'reverse':
        state.direction *= -1;
        this.nextTurn(state);
        if (state.players.length === 2) this.nextTurn(state);
        break;
      case 'skip':
        this.nextTurn(state);
        this.nextTurn(state);
        break;
      case 'draw_two':
        this.stackDraw(state, 2);
        break;
      case 'wild_draw_four':
        this.stackDraw(state, 4);
        break;
      default:
        this.nextTurn(state);
        break;
    }
  }

  createGame(roomId: string): GameState {
    let deck = this.deckHelper.shuffle(this.deckHelper.generateDeck());
    const discardPile: Card[] = [];

    let firstCard: Card | undefined;
    let attempt = 0;

    while (attempt < 5) {
      const [drawn, remaining] = this.deckHelper.draw(deck, 1);
      if (drawn.length === 0)
        throw new Error('Deck exhausted during initialization');

      if (drawn[0].color === 'wild') {
        attempt++;
        deck = this.deckHelper.shuffle(this.deckHelper.generateDeck());
        continue;
      }

      firstCard = drawn[0];
      deck = remaining;
      discardPile.push(firstCard);
      break;
    }

    if (!firstCard) throw new Error('Failed to initialize valid starting card');

    const state: GameState = {
      roomId,
      players: [],
      deck,
      discardPile,
      currentCard: firstCard,
      currentColor: firstCard.color,
      currentPlayerIndex: 0,
      direction: 1,
      drawStack: 0,
      isActive: false,
      version: 1,
    };

    this.store.save(roomId, state);
    return state;
  }

  addPlayer(roomId: string, player: Player): GameState {
    const state = this.store.get(roomId);
    if (!state) throw new Error('Game not found');
    if (state.isActive) throw new Error('Game already started');
    if (state.players.find((p) => p.id === player.id))
      throw new Error('Player exists');

    state.players.push({ ...player, hand: [] });
    this.store.save(roomId, state);
    return state;
  }

  playCard(
    roomId: string,
    playerId: string,
    card: Card,
    chosenColor?: string,
  ): GameState {
    const state = this.store.get(roomId);
    if (!state || !state.isActive)
      throw new Error('Game not found or inactive');

    const player = state.players[state.currentPlayerIndex];
    if (player.id !== playerId) throw new Error('Not your turn');

    if (!this.validatePlay(card, state.currentCard!, state.currentColor!)) {
      throw new Error('Invalid card');
    }

    player.hand = player.hand.filter((c) => c.id !== card.id);

    this.applyCardEffect(state, card);

    state.discardPile.push(card);
    state.currentCard = card;
    if (card.color === 'wild' && chosenColor) {
      state.currentColor = chosenColor;
    } else {
      state.currentColor = card.color;
    }

    if (player.hand.length === 0) {
      state.isActive = false;
      console.log(`${player.name} wins!`);
    }

    state.version++;
    this.store.save(roomId, state);
    return state;
  }

  drawCard(roomId: string, playerId: string): GameState {
    const state = this.store.get(roomId);
    if (!state) throw new Error('Game not found');
    const player = state.players.find((p) => p.id === playerId);
    if (!player) throw new Error('Player not found');

    let [drawn, remaining] = this.deckHelper.draw(state.deck, 1);
    if (drawn.length === 0) {
      const [newDeck, newDiscard] = this.deckHelper.refillFromDiscard(
        state.deck,
        state.discardPile,
      );
      state.deck = newDeck;
      state.discardPile = newDiscard;
      [drawn, remaining] = this.deckHelper.draw(state.deck, 1);
    }

    player.hand.push(...drawn);
    state.deck = remaining;

    this.nextTurn(state);
    this.store.save(roomId, state);
    return state;
  }
}
