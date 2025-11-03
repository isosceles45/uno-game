import { Card, Color } from '../../shared/types';

export class Deck {
  static COLORS: Color[] = ['red', 'blue', 'green', 'yellow'];

  generateDeck(): Card[] {
    const deck: Card[] = [];

    Deck.COLORS.forEach((color) => {
      deck.push({ id: `card_${color[0]}0`, color, type: 'number', value: 0 });

      for (let i = 1; i <= 9; i++) {
        for (let k = 0; k < 2; k++) {
          deck.push({
            id: `card_${color[0]}${i}`,
            color,
            type: 'number',
            value: i,
          });
        }
      }

      for (let k = 0; k < 2; k++) {
        deck.push({ id: `card_${color[0]}s`, color, type: 'skip' });
        deck.push({ id: `card_${color[0]}r`, color, type: 'reverse' });
        deck.push({ id: `card_${color[0]}d2c`, color, type: 'draw_two' });
      }
    });

    for (let i = 0; i < 4; i++) {
      deck.push({ id: 'card_w', color: 'wild', type: 'wild' });
      deck.push({ id: 'card_w4', color: 'wild', type: 'wild_draw_four' });
    }

    return deck;
  }

  shuffle<Card>(cardsArr: Card[]): Card[] {
    const cards = cardsArr.slice();
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    return cards;
  }

  draw(cards: Card[], count: number): [Card[], Card[]] {
    const drawn = cards.slice(0, count);
    const remaining = cards.slice(count);
    return [drawn, remaining];
  }

  refillFromDiscard(deck: Card[], discardPile: Card[]): [Card[], Card[]] {
    const top = discardPile[discardPile.length - 1];
    const newDeck = this.shuffle(discardPile.slice(0, -1));
    return [newDeck, [top]];
  }
}
