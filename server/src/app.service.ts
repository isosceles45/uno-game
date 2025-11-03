import { Injectable } from '@nestjs/common';
import { Deck } from './game/deck/deck.service';
import { Card } from './shared/types';

@Injectable()
export class AppService {
  getCardDeck(): Card[] {
    const deckObj = new Deck();
    const deck = deckObj.generateDeck();
    console.log('Deck with ' + deck.length + ' length generated');
    return deckObj.shuffle(deck);
  }
}
