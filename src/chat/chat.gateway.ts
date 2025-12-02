import {
    WebSocketGateway,
    SubscribeMessage,
    MessageBody,
    WebSocketServer,
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { JwtPayload } from '../auth/jwt.strategy'; // Réutilisation de l'interface du JWT


// Le Gateway sera accessible via l'URL de votre API REST (ex: http://localhost:3000)
@WebSocketGateway({
    cors: {
        origin: '*', // Permettre les connexions depuis le frontend (à adapter en production)
    },
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;

    constructor(
        private readonly chatService: ChatService,
        private readonly jwtService: JwtService, // Injecté grâce à l'export du AuthModule
    ) {}

    afterInit(server: Server) {
        console.log('Chat Gateway initialisé.');
    }

    /**
     * Authentifie l'utilisateur via son token JWT lors de la connexion.
     */
    async handleConnection(client: Socket, ...args: any[]) {
        try {
            const token = client.handshake.auth.token || (client.handshake.query.token as string);

            if (!token) {
                return client.disconnect(true);
            }

            // Vérifier le token et extraire le payload
            const payload: JwtPayload = this.jwtService.verify(token);

            // Stocker les infos dans l'objet Socket
            client.data.user = { employeId: payload.sub, email: payload.email, role: payload.role };

            // Joindre une room spécifique à l'utilisateur (utile pour les notifications)
            client.join(client.data.user.employeId);

            console.log(`Client connecté: ${client.id} (Employé ID: ${client.data.user.employeId})`);

        } catch (e) {
            console.error('Erreur d\'authentification Socket:', e.message);
            client.disconnect(true);
        }
    }

    /**
     * Gère la déconnexion d'un client.
     */
    handleDisconnect(client: Socket) {
        if (client.data.user) {
            console.log(`Client déconnecté: ${client.id} (Employé ID: ${client.data.user.employeId})`);
        }
    }

    /**
     * Événement: 'sendMessage' - Reçoit un message, l'enregistre et l'émet.
     */
    @SubscribeMessage('sendMessage')
    async handleMessage(
        @MessageBody() createMessageDto: CreateMessageDto,
        @ConnectedSocket() client: Socket,
    ) {
        const user = client.data.user;

        if (!user) {
            throw new UnauthorizedException('Non autorisé via Socket.');
        }

        try {
            // 1. Enregistrer le message en base de données
            const message = await this.chatService.createMessage(createMessageDto, user.employeId);

            // 2. Définir le nom de la room (basé sur l'ID de la conversation)
            const roomName = `conversation-${createMessageDto.conversationId}`;
            
            // 3. Émettre l'événement 'newMessage' à tous les clients de cette conversation (room)
            this.server.to(roomName).emit('newMessage', message);
            
        } catch (error) {
            client.emit('error', { message: error.message || 'Erreur lors de l\'envoi du message.' });
        }
    }
    
    /**
     * Événement: 'joinConversation' - Permet au client de joindre la room Socket.io d'une conversation.
     * C'est essentiel pour recevoir les messages de cette conversation.
     */
    @SubscribeMessage('joinConversation')
    async handleJoinConversation(
        @MessageBody() conversationId: string,
        @ConnectedSocket() client: Socket,
    ) {
        if (!client.data.user) {
            return client.emit('error', { message: 'Non autorisé à rejoindre la conversation.' });
        }
        
        const roomName = `conversation-${conversationId}`;
        client.join(roomName);
        
        console.log(`Client ${client.data.user.employeId} a rejoint la room: ${roomName}`);
        
        // Optionnel: Envoyer l'historique au client qui vient de joindre
        try {
            const messages = await this.chatService.getMessages(conversationId);
            client.emit('conversationHistory', messages);
        } catch (error) { 
             client.emit('error', { message: 'Erreur lors de la récupération de l\'historique.' });
        }
        
        // Notifier la room que l'utilisateur a rejoint
        this.server.to(roomName).emit('userJoined', client.data.user.employeId);
    }
}