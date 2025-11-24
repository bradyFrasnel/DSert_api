import { 
  Injectable, 
  NotFoundException, 
  ConflictException,
  InternalServerErrorException,
  BadRequestException, 
  ForbiddenException, 
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmployeService } from '../employe/employe.service';
import { CreateConvocationDto } from './dto/create-convocation.dto';
import { UpdateConvocationDto, UpdateParticipantDto } from './dto/update-convocation.dto';
import { ConvocationResponse, StatutConvocationType, ParticipantResponse } from './types/convocation.types';
import { Prisma } from '@prisma/client';

// Type étendu pour inclure les relations
type ConvocationWithRelations = Prisma.ConvocationGetPayload<{
  include: {
    emetteur: true;
    participants: {
      include: {
        employe: true;
      };
    };
    piecesJointes: true;
  };
}>;

@Injectable()
export class ConvocationService {
  constructor(
    private prisma: PrismaService,
    private employeService: EmployeService,
  ) {}

  /**
   * Mappe une convocation complète de Prisma vers le format de réponse API.
   */
  private formatConvocationResponse(
    convocation: ConvocationWithRelations,
  ): ConvocationResponse {
    
    const participantsResponse: ParticipantResponse[] = convocation.participants.map(
      (status): ParticipantResponse => ({
        id: status.employe.id,
        nom: status.employe.nom_famille, 
        prenom: status.employe.prenom,
        email: status.employe.email,
        statut: status.statut as unknown as StatutConvocationType,
        // statut: status.statut as StatutConvocationType,
        date_lecture: status.date_lecture,
        date_mise_a_jour: status.date_mise_a_jour,
        remarque: status.remarques, // DB: remarques → API: remarque
      }),
    );

    return {
      id: convocation.id,
      titre: convocation.titre,
      description: convocation.description,
      date_creation: convocation.date_creation,
      date_debut: convocation.date_convocation,
      date_fin: convocation.heure_fin,

      emetteur: {
        id: convocation.emetteur.id,
        nom: convocation.emetteur.nom_famille,
        prenom: convocation.emetteur.prenom,
        email: convocation.emetteur.email,
      },

      participants: participantsResponse,
      piecesJointes: convocation.piecesJointes.map(pj => ({
        id: pj.id,
        nom_fichier: pj.nom_fichier,
        chemin: pj.chemin,
        type_mime: pj.type_mime,
        taille: pj.taille,
        date_upload: pj.date_upload,
      })),
    };
  }

  /**
   * Configuration d'inclusion standard pour une convocation.
   */
  private getConvocationIncludeConfig() {
    return {
      emetteur: true,
      participants: {
        include: {
          employe: true,
        },
      },
      piecesJointes: true,
    } as const;
  }

  /**
   * Crée une nouvelle convocation et les statuts des participants.
   */
  async create(
    createConvocationDto: CreateConvocationDto,
    emetteurId: string,
  ): Promise<ConvocationResponse> {
    const { 
      participants,
      piecesJointes = [],
      date_convocation,
      heure_debut,
      heure_fin,
      ...convocationData 
    } = createConvocationDto;

    // 1. Vérifier l'existence de l'émetteur
    const emetteur = await this.prisma.employe.findUnique({
      where: { id: emetteurId }
    });
    if (!emetteur) {
      throw new NotFoundException('Émetteur non trouvé');
    }

    // 2. Vérifier si tous les participants existent
    const participantsIds = participants.map(p => p.employeId);
    const existingEmployees = await this.prisma.employe.findMany({
      where: { id: { in: participantsIds } },
      select: { id: true },
    });
    
    if (existingEmployees.length !== participantsIds.length) {
      const existingIds = new Set(existingEmployees.map(e => e.id));
      const missingIds = participantsIds.filter(id => !existingIds.has(id));
      throw new BadRequestException(`Les ID d'employés suivants sont introuvables: ${missingIds.join(', ')}`);
    }

    // 3. Vérifier les pièces jointes
    if (piecesJointes.length > 0) {
      const existingPieces = await this.prisma.pieceJointe.count({
        where: { id: { in: piecesJointes } }
      });
      
      if (existingPieces !== piecesJointes.length) {
        throw new NotFoundException('Une ou plusieurs pièces jointes sont introuvables');
      }
    }

    // 4. Créer la conversation si nécessaire
    let conversationId: string | undefined;
    if (createConvocationDto.avecChat) {
      const conversation = await this.prisma.conversation.create({
        data: {
          nom_conversation: `Convocation: ${createConvocationDto.titre}`,
          type_conversation: 'groupe_convocation',
          date_creation: new Date(),
          createurId: emetteurId,
        }
      });
      conversationId = conversation.id;
    }

    // 5. Créer la convocation
    try {
      const convocation = await this.prisma.convocation.create({
        data: {
          ...convocationData,
          date_convocation: new Date(date_convocation),
          heure_debut,
          heure_fin: heure_fin || null,
          emetteurId: emetteurId,
          conversationId,
          
          participants: {
            create: participants.map(participant => ({
              employeId: participant.employeId,
              statut: 'ENVOYE',
              date_mise_a_jour: new Date(),
              remarques: participant.remarque || null,
            })),
          },
          piecesJointes: {
            create: piecesJointes.map(pieceJointeId => ({
              id: pieceJointeId,
              nom_fichier: 'temp', // Ces valeurs doivent être fournies
              chemin: 'temp',
              type_mime: 'temp',
              taille: 0,
            }))
          }
        },
        include: this.getConvocationIncludeConfig(),
      });

      return this.formatConvocationResponse(convocation as ConvocationWithRelations);

    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Une convocation similaire existe déjà');
      }
      throw new InternalServerErrorException('Erreur lors de la création de la convocation');
    }
  }

  /**
   * Récupère toutes les convocations (avec filtres selon le rôle).
   */
  async findAll(
    page: number, 
    limit: number, 
    user: { userId: string, role: string }
  ): Promise<any> {
    const skip = (page - 1) * limit;

    let where: Prisma.ConvocationWhereInput = {};

    // Un employé ne voit que ses convocations (en tant qu'émetteur ou participant)
    if (user.role === 'employe' || user.role === 'manager') {
      where = {
        OR: [
          { emetteurId: user.userId },
          { participants: { some: { employeId: user.userId } } },
        ],
      };
    }

    const [convocations, total] = await this.prisma.$transaction([
      this.prisma.convocation.findMany({
        where,
        take: limit,
        skip,
        orderBy: { date_creation: 'desc' },
        include: this.getConvocationIncludeConfig(),
      }),
      this.prisma.convocation.count({ where }),
    ]);

    const mappedData = convocations.map(convocation => this.formatConvocationResponse(convocation as ConvocationWithRelations));

    return {
      data: mappedData,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Récupère une seule convocation par ID.
   */
  async findOne(id: string): Promise<ConvocationResponse> {
    const convocation = await this.prisma.convocation.findUnique({
      where: { id },
      include: this.getConvocationIncludeConfig(),
    });

    if (!convocation) {
      throw new NotFoundException(`Convocation avec l'ID ${id} non trouvée.`);
    }

    return this.formatConvocationResponse(convocation as ConvocationWithRelations);
  }

  /**
   * Met à jour une convocation.
   */
  async update(
    id: string, 
    updateConvocationDto: UpdateConvocationDto, 
    userId: string
  ): Promise<ConvocationResponse> {
    
    // Vérification de l'existence et des droits
    const existingConvocation = await this.prisma.convocation.findUnique({
      where: { id },
      include: {
        emetteur: true,
        participants: true
      }
    });

    if (!existingConvocation) {
      throw new NotFoundException(`Convocation avec l'ID ${id} non trouvée.`);
    }

    // Récupérer le rôle de l'utilisateur
    const user = await this.prisma.employe.findUnique({
      where: { id: userId }
    });
    
    const isAuthorized = user?.role === 'ADMIN' || user?.role === 'MANAGER' || existingConvocation.emetteur.id === userId;
    
    if (!isAuthorized) {
        throw new ForbiddenException("Vous n'êtes pas autorisé à modifier cette convocation.");
    }

    const { participants, ...updateData } = updateConvocationDto;

    // 1. Mise à jour de la convocation de base
    const updatedConvocation = await this.prisma.convocation.update({
      where: { id },
      data: {
        ...updateData,
        date_convocation: updateData.date_convocation ? new Date(updateData.date_convocation) : undefined,
      },
      include: this.getConvocationIncludeConfig(),
    });

    // 2. Gestion des participants (Mise à jour du statut uniquement)
    if (participants && participants.length > 0) {
      const updates = participants
        .filter((p): p is UpdateParticipantDto & { employeId: string } => !!p.employeId)
        .map(p => {
          const dataToUpdate: Prisma.StatutConvocationUpdateInput = {
            date_mise_a_jour: new Date(),
          };

          if (p.statut) {
            // Convertir la string en enum Prisma
            dataToUpdate.statut = p.statut as any;
          }
          if (p.remarque !== undefined) {
            dataToUpdate.remarques = p.remarque;
          }

          return this.prisma.statutConvocation.update({
            where: {
              convocationId_employeId: {
                convocationId: id,
                employeId: p.employeId,
              },
            },
            data: dataToUpdate,
          });
        });

      if (updates.length > 0) {
        await this.prisma.$transaction(updates);
      }
    }

    // Recharger la convocation complète pour la réponse
    const finalConvocation = await this.prisma.convocation.findUnique({
      where: { id },
      include: this.getConvocationIncludeConfig(),
    });

    return this.formatConvocationResponse(finalConvocation as ConvocationWithRelations);
  }

  /**
   * Ajoute de nouveaux participants à une convocation existante.
   */
  async addParticipants(
    convocationId: string, 
    newParticipants: CreateConvocationDto['participants'],
    userId: string,
  ): Promise<ConvocationResponse> {
    const existingConvocation = await this.prisma.convocation.findUnique({
      where: { id: convocationId },
      include: { participants: true, emetteur: true },
    });

    if (!existingConvocation) {
      throw new NotFoundException(`Convocation avec l'ID ${convocationId} non trouvée.`);
    }
    
    // Vérification des droits
    const user = await this.prisma.employe.findUnique({
      where: { id: userId }
    });
    const isAuthorized = user?.role === 'ADMIN' || user?.role === 'MANAGER' || existingConvocation.emetteur.id === userId;
    
    if (!isAuthorized) {
        throw new ForbiddenException("Vous n'êtes pas autorisé à ajouter des participants à cette convocation.");
    }
    
    // Filtrer les participants qui sont déjà dans la convocation
    const existingParticipantIds = new Set(existingConvocation.participants.map(s => s.employeId));
    const participantsToAdd = newParticipants.filter(p => !existingParticipantIds.has(p.employeId));
    
    if (participantsToAdd.length === 0) {
        throw new BadRequestException("Tous les employés spécifiés sont déjà participants.");
    }

    // Créer les nouveaux statuts
    await this.prisma.statutConvocation.createMany({
      data: participantsToAdd.map(participant => ({
        convocationId: convocationId,
        employeId: participant.employeId,
        statut: 'ENVOYE',
        remarques: participant.remarque || null,
        date_mise_a_jour: new Date(),
      })),
      skipDuplicates: true,
    });
    
    // Recharger et retourner la convocation mise à jour
    return this.findOne(convocationId);
  }

  /**
   * Supprime un participant d'une convocation.
   */
  async removeParticipant(
    convocationId: string,
    participantId: string,
    userId: string,
  ): Promise<ConvocationResponse> {
    const existingConvocation = await this.prisma.convocation.findUnique({
      where: { id: convocationId },
      include: { participants: { select: { employeId: true } }, emetteur: true },
    });

    if (!existingConvocation) {
      throw new NotFoundException(`Convocation avec l'ID ${convocationId} non trouvée.`);
    }

    // Vérification des droits
    const user = await this.prisma.employe.findUnique({
      where: { id: userId }
    });
    const isAuthorized = user?.role === 'ADMIN' || user?.role === 'MANAGER' || existingConvocation.emetteur.id === userId;
    
    if (!isAuthorized) {
        throw new ForbiddenException("Vous n'êtes pas autorisé à retirer des participants de cette convocation.");
    }

    // Vérifier si le participant est bien dans la convocation
    const isParticipant = existingConvocation.participants.some(s => s.employeId === participantId);

    if (!isParticipant) {
      throw new NotFoundException(`L'employé ${participantId} n'est pas un participant à la convocation ${convocationId}.`);
    }

    // Suppression de l'entrée dans la table de pivot
    await this.prisma.statutConvocation.delete({
      where: {
        convocationId_employeId: {
          convocationId: convocationId,
          employeId: participantId,
        },
      },
    });

    // Recharger et retourner la convocation mise à jour
    return this.findOne(convocationId);
  }

  /**
   * Suppression de la convocation.
   */
  async remove(id: string, userId: string) {
    // Vérification des droits
    const existingConvocation = await this.prisma.convocation.findUnique({
      where: { id },
      include: { emetteur: true },
    });

    if (!existingConvocation) {
      throw new NotFoundException(`Convocation avec l'ID ${id} non trouvée.`);
    }

    // Récupérer le rôle de l'utilisateur
    const user = await this.prisma.employe.findUnique({
      where: { id: userId }
    });
    const isAuthorized = user?.role === 'ADMIN' || user?.role === 'MANAGER' || existingConvocation.emetteur.id === userId;
    
    if (!isAuthorized) {
        throw new ForbiddenException("Vous n'êtes pas autorisé à supprimer cette convocation.");
    }
    
    // La suppression en cascade est gérée par Prisma
    await this.prisma.convocation.delete({
      where: { id },
    });
    
    return { message: `Convocation avec l'ID ${id} supprimée avec succès.` };
  }
}