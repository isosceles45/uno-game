export interface Card {
  id: string;
  color: 'red' | 'blue' | 'green' | 'yellow' | 'wild';
  type: 'number' | 'skip' | 'reverse' | 'draw_two' | 'wild' | 'wild_draw_four';
  value?: number;
}

export interface Player {
  id: string;
  name: string;
  hand: Card[];
}

export interface GameState {
  roomId: string;
  players: Player[];
  deck: Card[];
  discardPile: Card[];
  currentCard: Card | null;
  currentColor: string | null;
  currentPlayerIndex: number;
  direction: number;
  drawStack: number;
  isActive: boolean;
  version: number;
}
