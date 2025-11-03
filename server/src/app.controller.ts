import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Card } from './shared/types';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/cards')
  getDeck(): Card[] {
    return this.appService.getCardDeck();
  }
}
