import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { JwtService } from '@nestjs/jwt';
import { Logger, UnauthorizedException } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtPayload } from '../auth/jwt.strategy';
// import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
  },
  namespace: 'chat',
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialisé');
  }

  async handleConnection(client: Socket) {
    try {
      const token = this.getTokenFromSocket(client);
      if (!token) {
        throw new UnauthorizedException('Token manquant');
      }

      const payload = this.jwtService.verify<JwtPayload>(token);
      if (!payload) {
        throw new UnauthorizedException('Token invalide');
      }

      // Stocker les informations de l'utilisateur dans la socket
      client.data.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      };

      // Rejoindre une room personnelle pour les notifications
      client.join(`user_${payload.sub}`);

      this.logger.log(`Client connecté: ${client.id} (User ID: ${payload.sub})`);

      // Informer l'utilisateur qu'il est bien connecté
      client.emit('connected', { userId: payload.sub });
    } catch (error) {
      this.logger.error(`Erreur de connexion: ${error.message}`);
      client.emit('error', { message: 'Échec de l\'authentification' });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    if (client.data.user) {
      this.logger.log(`Client déconnecté: ${client.id} (User ID: ${client.data.user.id})`);
    }
  }

  @SubscribeMessage('joinConversation')
  async handleJoinConversation(
    @MessageBody() conversationId: string,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userId = client.data.user?.id;
      if (!userId) {
        throw new UnauthorizedException('Non authentifié');
      }

      // Vérifier que l'utilisateur est membre de la conversation
      const isMember = await this.chatService['prisma'].membreConversation.findFirst({
        where: {
          conversationId,
          employeId: userId,
          dateSortie: null,
        },
      });

      if (!isMember) {
        throw new Error('Vous n\'êtes pas membre de cette conversation');
      }

      // Rejoindre la room de la conversation
      client.join(`conversation_${conversationId}`);

      // Envoyer l'historique des messages
      const messages = await this.chatService.getMessages(conversationId, userId, 50, 0);
      client.emit('conversationHistory', messages);

      // Informer les autres membres
      client.to(`conversation_${conversationId}`).emit('userJoined', {
        userId,
        conversationId,
        timestamp: new Date(),
      });

      return { status: 'success', conversationId };
    } catch (error) {
      client.emit('error', { message: error.message });
      return { status: 'error', message: error.message };
    }
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() createMessageDto: CreateMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userId = client.data.user?.id;
      if (!userId) {
        throw new UnauthorizedException('Non authentifié');
      }

      // Créer le message
      const message = await this.chatService.createMessage(createMessageDto, userId);

      // Diffuser le message à tous les membres de la conversation
      this.server.to(`conversation_${createMessageDto.conversationId}`).emit('newMessage', message);

      return { status: 'success', message };
    } catch (error) {
      client.emit('error', { message: error.message });
      return { status: 'error', message: error.message };
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() data: { conversationId: string; isTyping: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.user?.id;
    if (!userId) return;

    // Informer les autres membres de la conversation que l'utilisateur est en train d'écrire
    client.to(`conversation_${data.conversationId}`).emit('userTyping', {
      userId,
      isTyping: data.isTyping,
    });
  }

  private getTokenFromSocket(client: Socket): string | null {
    // Vérifier d'abord dans les query params
    const tokenQuery = client.handshake.query?.token;
    if (tokenQuery && typeof tokenQuery === 'string') {
      return tokenQuery;
    }

    // Vérifier dans les headers
    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.split(' ')[1];
    }

    return null;
  }
}