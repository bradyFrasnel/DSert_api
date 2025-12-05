import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
  Delete,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateMessageDto } from './dto/create-message.dto';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('chat')
@ApiBearerAuth()
@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('conversations')
  @ApiOperation({ summary: 'Créer une nouvelle conversation' })
  @ApiResponse({ status: 201, description: 'Conversation créée avec succès' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  createConversation(@Body() createConversationDto: CreateConversationDto, @Request() req) {
    return this.chatService.createConversation(createConversationDto, req.user.id);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Obtenir les conversations de l\'utilisateur' })
  @ApiResponse({ status: 200, description: 'Liste des conversations' })
  getUserConversations(@Request() req) {
    return this.chatService.getUserConversations(req.user.id);
  }

  @Post('messages')
  @ApiOperation({ summary: 'Envoyer un message' })
  @ApiResponse({ status: 201, description: 'Message envoyé avec succès' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  createMessage(@Body() createMessageDto: CreateMessageDto, @Request() req) {
    return this.chatService.createMessage(createMessageDto, req.user.id);
  }

  @Get('conversations/:conversationId/messages')
  @ApiOperation({ summary: 'Obtenir les messages d\'une conversation' })
  @ApiResponse({ status: 200, description: 'Liste des messages' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  getMessages(
    @Param('conversationId') conversationId: string,
    @Request() req,
    @Query('limit') limit = 50,
    @Query('offset') offset = 0,
  ) {
    return this.chatService.getMessages(conversationId, req.user.id, +limit, +offset);
  }

  @Post('conversations/:conversationId/participants')
  @ApiOperation({ summary: 'Ajouter des participants à une conversation' })
  @ApiResponse({ status: 200, description: 'Participants ajoutés avec succès' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  addParticipants(
    @Param('conversationId') conversationId: string,
    @Body() userIds: string[],
    @Request() req,
  ) {
    return this.chatService.addParticipants(conversationId, userIds, req.user.id);
  }

  @Delete('messages/:messageId')
  @ApiOperation({ summary: 'Supprimer un message' })
  @ApiResponse({ status: 200, description: 'Message supprimé avec succès' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  deleteMessage(@Param('messageId') messageId: string, @Request() req) {
    return this.chatService.deleteMessage(messageId, req.user.id);
  }
}