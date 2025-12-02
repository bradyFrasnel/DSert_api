import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module'; // Nécessaire pour injecter JwtService

@Module({
  imports: [
    PrismaModule,
    AuthModule, // Importe JwtModule
  ],
  providers: [ChatGateway, ChatService],
  exports: [ChatService], 
})
export class ChatModule {}