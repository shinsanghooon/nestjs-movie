import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { User } from 'src/user/entities/user.entity';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ChatRoom } from './entity/chat-room.entity';
import { Chat } from './entity/chat.entity';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([User, Chat, ChatRoom])],
  providers: [ChatGateway, ChatService],
})
export class ChatModule { }
