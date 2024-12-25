import { UseInterceptors } from '@nestjs/common';
import { ConnectedSocket, MessageBody, OnGatewayConnection, SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { WsQueryRunner } from 'src/common/decorator/ws-query-runner.decorator';
import { WsTransactionInterceptor } from 'src/common/interceptor/ws-transaction.interceptor';
import { QueryRunner } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { ChatService } from './chat.service';
import { CreateChatDto } from './dto/create-chat.dto';

@WebSocketGateway()
export class ChatGateway implements OnGatewayConnection {
  constructor(
    private readonly chatService: ChatService,
    private readonly authService: AuthService
  ) { }

  async handleConnection(client: Socket) {
    try {

      const rawToken = client.handshake.headers.authorization;
      const payload = await this.authService.parseBearerToken(rawToken, false);

      if (payload) {
        client.data.user = payload;
        this.chatService.registerClient(payload.sub, client);
      } else {
        client.disconnect();
      }

    } catch (e) {
      console.log(e);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const user = client.data.user;

    if (user) {
      this.chatService.removeClient(user.sub);
    }

  }

  @SubscribeMessage('sendMessage')
  @UseInterceptors(WsTransactionInterceptor)
  async sendMessage(
    @MessageBody() data: CreateChatDto,
    @ConnectedSocket() client: Socket,
    @WsQueryRunner() qr: QueryRunner
  ) {
    // CS를 위한 채팅방
    // 사용자는 1개의 방에만 들어갈 수 있고, admin은 여러 사용자와 채팅을 해야한다.

    const payload = client.data.user;
    await this.chatService.createMessage(payload, data, qr);
  }
}
