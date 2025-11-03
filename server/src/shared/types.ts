export type Color = 'red' | 'blue' | 'green' | 'yellow' | 'wild';
export type CardType =
  | 'number'
  | 'skip'
  | 'reverse'
  | 'draw_two'
  | 'wild'
  | 'wild_draw_four';

export interface Card {
  id: string; //  This will have path for the assets folder to open image
  color: Color;
  type: CardType;
  value?: number;
}

export interface Player {
  id: string;
  name: string;
  socketId?: string;
  hand: Card[];
  hasSaidUno?: boolean;
  isConnected?: boolean;
}

export interface GameState {
  roomId: string;
  players: Player[];
  deck: Card[];
  discardPile: Card[];
  currentCard?: Card;
  currentColor?: string;
  currentPlayerIndex: number;
  direction: 1 | -1;
  drawStack: number;
  isActive: boolean;
  version: number;
}
