import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { Message, Conversation, MembreConversation } from '@prisma/client';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  // Créer une nouvelle conversation
  async createConversation(createConversationDto: CreateConversationDto, createurId: string) {
    const { nom, description, participants, convocationId } = createConversationDto;

    // Vérifier que le créateur fait partie des participants
    if (!participants.includes(createurId)) {
      participants.push(createurId);
    }

    // Vérifier que tous les participants existent
    const participantsCount = await this.prisma.employe.count({
      where: {
        id: { in: participants },
        actif: true,
      },
    });

    if (participantsCount !== participants.length) {
      throw new NotFoundException('Un ou plusieurs participants sont introuvables');
    }

    // Créer la conversation
    return this.prisma.conversation.create({
      data: {
        nom: nom || `Conversation du ${new Date().toLocaleDateString()}`,
        description,
        type: convocationId ? 'groupe_convocation' : 'groupe',
        createur: { connect: { id: createurId } },
        convocation: convocationId ? { connect: { id: convocationId } } : undefined,
        membres: {
          create: participants.map(participantId => ({
            employe: { connect: { id: participantId } },
            estAdmin: participantId === createurId,
          })),
        },
      },
      include: {
        membres: {
          include: {
            employe: {
              select: {
                id: true,
                prenom: true,
                nomFamille: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  // Envoyer un message
  async createMessage(createMessageDto: CreateMessageDto, auteurId: string) {
    const { conversationId, contenu } = createMessageDto;

    // Vérifier que l'utilisateur est membre de la conversation
    const isMember = await this.prisma.membreConversation.findFirst({
      where: {
        conversationId,
        employeId: auteurId,
        dateSortie: null,
      },
    });

    if (!isMember) {
      throw new ForbiddenException('Vous n\'êtes pas membre de cette conversation');
    }

    // Créer le message
    return this.prisma.message.create({
      data: {
        contenu,
        conversation: { connect: { id: conversationId } },
        auteur: { connect: { id: auteurId } },
      },
      include: {
        auteur: {
          select: {
            id: true,
            prenom: true,
            nomFamille: true,
            email: true,
          },
        },
      },
    });
  }

  // Obtenir les messages d'une conversation
  async getMessages(conversationId: string, userId: string, limit = 50, offset = 0) {
    // Vérifier que l'utilisateur est membre de la conversation
    const isMember = await this.prisma.membreConversation.findFirst({
      where: {
        conversationId,
        employeId: userId,
        dateSortie: null,
      },
    });

    if (!isMember) {
      throw new ForbiddenException('Vous n\'êtes pas membre de cette conversation');
    }

    return this.prisma.message.findMany({
      where: {
        conversationId,
        estSupprime: false,
      },
      include: {
        auteur: {
          select: {
            id: true,
            prenom: true,
            nomFamille: true,
            email: true,
          },
        },
      },
      orderBy: {
        dateEnvoi: 'asc',
      },
      take: limit,
      skip: offset,
    });
  }

  // Obtenir les conversations d'un utilisateur
  async getUserConversations(userId: string) {
    return this.prisma.conversation.findMany({
      where: {
        membres: {
          some: {
            employeId: userId,
            dateSortie: null,
          },
        },
      },
      include: {
        membres: {
          where: {
            dateSortie: null,
          },
          include: {
            employe: {
              select: {
                id: true,
                prenom: true,
                nomFamille: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            messages: {
              where: {
                estSupprime: false,
              },
            },
          },
        },
        messages: {
          take: 1,
          orderBy: {
            dateEnvoi: 'desc',
          },
          select: {
            contenu: true,
            dateEnvoi: true,
            auteur: {
              select: {
                prenom: true,
              },
            },
          },
        },
      },
      orderBy: {
        messages: {
          _count: 'desc',
        },
      },
    });
  }

  // Ajouter des participants à une conversation
  async addParticipants(conversationId: string, userIds: string[], currentUserId: string) {
    // Vérifier que l'utilisateur est administrateur de la conversation
    const isAdmin = await this.prisma.membreConversation.findFirst({
      where: {
        conversationId,
        employeId: currentUserId,
        estAdmin: true,
        dateSortie: null,
      },
    });

    if (!isAdmin) {
      throw new ForbiddenException('Vous devez être administrateur pour ajouter des participants');
    }

    // Vérifier que les utilisateurs à ajouter existent
    const existingUsers = await this.prisma.employe.findMany({
      where: {
        id: { in: userIds },
        actif: true,
      },
      select: { id: true },
    });

    const existingUserIds = existingUsers.map(user => user.id);
    const nonExistingUserIds = userIds.filter(id => !existingUserIds.includes(id));

    if (nonExistingUserIds.length > 0) {
      throw new NotFoundException(`Utilisateurs non trouvés: ${nonExistingUserIds.join(', ')}`);
    }

    // Vérifier qu'ils ne sont pas déjà membres
    const existingMembers = await this.prisma.membreConversation.findMany({
      where: {
        conversationId,
        employeId: { in: existingUserIds },
        dateSortie: null,
      },
    });

    const existingMemberIds = existingMembers.map(member => member.employeId);
    const newUserIds = existingUserIds.filter(id => !existingMemberIds.includes(id));

    if (newUserIds.length === 0) {
      return { count: 0, message: 'Aucun nouvel utilisateur à ajouter' };
    }

    // Ajouter les nouveaux membres
    const result = await this.prisma.membreConversation.createMany({
      data: newUserIds.map(userId => ({
        conversationId,
        employeId: userId,
        estAdmin: false,
      })),
    });

    return {
      count: result.count,
      message: `${result.count} participant(s) ajouté(s) avec succès`,
    };
  }

  // Supprimer un message (marquer comme supprimé)
  async deleteMessage(messageId: string, userId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message non trouvé');
    }

    // Seul l'auteur peut supprimer son message
    if (message.auteurId !== userId) {
      throw new ForbiddenException('Vous ne pouvez pas supprimer ce message');
    }

    return this.prisma.message.update({
      where: { id: messageId },
      data: {
        estSupprime: true,
      },
    });
  }
}