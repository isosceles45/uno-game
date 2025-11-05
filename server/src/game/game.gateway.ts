import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';
import { GameStore } from './store/store';
import { Player, Card } from '../shared/types';

@WebSocketGateway({
  cors: { origin: 'http://localhost:4200' },
})
export class GameGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly gameService: GameService,
    private readonly store: GameStore,
  ) {}

  @SubscribeMessage('join')
  async handleJoin(
    @MessageBody() data: { roomId: string; player: Player },
    @ConnectedSocket() client: Socket,
  ) {
    let state = this.store.get(data.roomId);

    if (!state) {
      console.log(`Creating new room: ${data.roomId}`);
      state = this.gameService.createGame(data.roomId);
    }

    try {
      state = this.gameService.addPlayer(data.roomId, data.player);
      await client.join(data.roomId);
      this.server.to(data.roomId).emit('state', state);
      console.log(`${data.player.name} joined room ${data.roomId}`);
    } catch (err) {
      client.emit('error', { message: (err as Error).message });
    }
  }

  @SubscribeMessage('start')
  handleStart(@MessageBody() data: { roomId: string }) {
    const state = this.store.get(data.roomId);
    if (!state) return;

    if (state.players.length < 2) {
      this.server
        .to(data.roomId)
        .emit('error', { message: '2 players required to start!' });
      return;
    }

    for (const player of state.players) {
      const [drawn, remaining] = this.gameService['deckHelper'].draw(
        state.deck,
        7,
      );
      player.hand.push(...drawn);
      state.deck = remaining;
    }

    state.isActive = true;
    this.store.save(data.roomId, state);

    this.server.to(data.roomId).emit('state', state);
    console.log(`Game started in ${data.roomId}`);
  }

  @SubscribeMessage('play')
  handlePlay(
    @MessageBody()
    data: {
      roomId: string;
      playerId: string;
      card: Card;
      color?: string;
    },
  ) {
    try {
      const state = this.gameService.playCard(
        data.roomId,
        data.playerId,
        data.card,
        data.color,
      );
      this.server.to(data.roomId).emit('state', state);
    } catch (err) {
      this.server
        .to(data.roomId)
        .emit('error', { message: (err as Error).message });
    }
  }

  @SubscribeMessage('draw')
  handleDraw(@MessageBody() data: { roomId: string; playerId: string }) {
    try {
      const state = this.gameService.drawCard(data.roomId, data.playerId);
      this.server.to(data.roomId).emit('state', state);
    } catch (err) {
      this.server
        .to(data.roomId)
        .emit('error', { message: (err as Error).message });
    }
  }

  @SubscribeMessage('yell_uno')
  handleYellUno(
    @MessageBody() data: { roomId: string; playerId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const state = this.gameService.handleUnoYell(data.roomId, data.playerId);
      this.server.to(data.roomId).emit('state', state);
    } catch (err) {
      client.emit('error', { message: (err as Error).message });
    }
  }
}
