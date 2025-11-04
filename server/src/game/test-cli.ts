import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { GameModule } from './game.module';
import { GameService } from './game.service';
import { Player } from '../shared/types';
import * as readline from 'readline';

@Module({
  imports: [GameModule],
})
class CliModule {}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(CliModule, {
    logger: ['error', 'warn'],
  });

  const gameService = app.get(GameService);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (q: string): Promise<string> =>
    new Promise((res) => rl.question(q, res));

  const roomId = 'room1';

  let state = gameService.createGame(roomId);

  const player1: Player = { id: 'p1', name: 'Alice', hand: [] };
  const player2: Player = { id: 'p2', name: 'Bob', hand: [] };
  state = gameService.addPlayer(roomId, player1);
  state = gameService.addPlayer(roomId, player2);

  for (const player of state.players) {
    const [drawn, remaining] = gameService['deckHelper'].draw(state.deck, 7);
    player.hand.push(...drawn);
    state.deck = remaining;
  }

  state.isActive = true;
  gameService['store'].save(roomId, state);

  console.log('Game started.');
  if (!state.currentCard) throw new Error('Game initialized incorrectly.');
  console.log(
    `First card: ${state.currentCard.color} ${state.currentCard.type} ${
      state.currentCard.value ?? ''
    }`,
  );

  while (state.isActive) {
    const current = state.players[state.currentPlayerIndex];
    const top = state.currentCard!;

    console.log('\n----------------------------------');
    console.log(`Current player: ${current.name}`);
    console.log(
      `Top card: ${top.color} ${top.type}${top.value !== undefined ? ' ' + top.value : ''}`,
    );
    console.log('Your hand:');
    current.hand.forEach((c, i) => {
      console.log(
        `${i}: ${c.color} ${c.type}${c.value !== undefined ? ' ' + c.value : ''}`,
      );
    });

    const input = await question(
      'Enter card index to play, or "d" to draw a card: ',
    );

    try {
      if (input.toLowerCase() === 'd') {
        state = gameService.drawCard(roomId, current.id);
      } else {
        const idx = parseInt(input, 10);
        const selected = current.hand[idx];
        if (!selected) {
          console.log('Invalid index.');
          continue;
        }

        if (selected.color === 'wild') {
          const newColor = await question(
            'Choose color (red, blue, green, yellow): ',
          );
          state = gameService.playCard(
            roomId,
            current.id,
            selected,
            newColor.trim().toLowerCase(),
          );
        } else {
          state = gameService.playCard(roomId, current.id, selected);
        }
      }

      if (!state.isActive) {
        console.log(`\n${current.name} wins the game!`);
        break;
      }

      console.log(
        `Next player: ${state.players[state.currentPlayerIndex].name}, Current color: ${state.currentColor}`,
      );
    } catch (err) {
      console.log('Error:', err);
    }
  }

  rl.close();
  await app.close();
}

bootstrap();
