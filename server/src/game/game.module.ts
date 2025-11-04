import { Module } from '@nestjs/common';
import { GameGateway } from './game.gateway';
import { GameService } from './game.service';
import { GameStore } from './store/store';
import { Deck } from './deck/deck.service';

@Module({
  providers: [Deck, GameService, GameGateway, GameStore],
  exports: [GameService],
})
export class GameModule {}
