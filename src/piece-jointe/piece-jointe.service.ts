import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PieceJointeResponseDto } from './dto/piece-jointe-response.dto';
import {
  createReadStream,
  unlinkSync,
  existsSync,
  mkdirSync,
  writeFile,
} from 'fs';
import { join } from 'path';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';

const writeFileAsync = promisify(writeFile);

@Injectable()
export class PieceJointeService {
  constructor(private prisma: PrismaService) {}

  async uploadFile(
    file: Express.Multer.File,
    convocationId: string,
    userId: string,
  ): Promise<PieceJointeResponseDto> {
    // Vérifier que la convocation existe et que l'utilisateur y a accès
    const convocation = await this.prisma.convocation.findUnique({
      where: { id: convocationId },
      include: { emetteur: true },
    });

    if (!convocation) {
      throw new NotFoundException('Convocation non trouvée');
    }

    if (convocation.emetteurId !== userId) {
      throw new ForbiddenException('Action non autorisée');
    }

    // Créer un nom de fichier unique
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;

    // Créer le répertoire de téléchargement s'il n'existe pas
    const uploadDir = join(process.cwd(), 'uploads');
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }

    // Enregistrer le fichier sur le disque
    const filePath = join(uploadDir, fileName);
    await writeFileAsync(filePath, file.buffer);

    // Enregistrer les métadonnées en base de données
    const pieceJointe = await this.prisma.pieceJointe.create({
      data: {
        nomFichier: file.originalname,
        chemin: fileName,
        typeMime: file.mimetype,
        taille: file.size,
        convocation: { connect: { id: convocationId } },
      },
    });

    return {
      id: pieceJointe.id,
      nomFichier: pieceJointe.nomFichier,
      typeMime: pieceJointe.typeMime,
      taille: pieceJointe.taille,
      url: `/pieces-jointes/${pieceJointe.id}/download`,
      convocationId: pieceJointe.convocationId,
      dateCreation: pieceJointe.dateUpload,
    };
  }

  async downloadFile(id: string) {
    const pieceJointe = await this.prisma.pieceJointe.findUnique({
      where: { id },
    });

    if (!pieceJointe) {
      throw new NotFoundException('Fichier non trouvé');
    }

    const uploadDir = join(process.cwd(), 'uploads');
    const filePath = join(uploadDir, pieceJointe.chemin);

    if (!existsSync(filePath)) {
      throw new NotFoundException('Fichier non trouvé sur le serveur');
    }

    return {
      stream: createReadStream(filePath),
      pieceJointe,
    };
  }

  async deleteFile(id: string, userId: string): Promise<{ message: string }> {
    const pieceJointe = await this.prisma.pieceJointe.findUnique({
      where: { id },
      include: { convocation: { include: { emetteur: true } } },
    });

    if (!pieceJointe) {
      throw new NotFoundException('Pièce jointe non trouvée');
    }

    // Vérifier les autorisations
    const isAuthorized =
      pieceJointe.convocation.emetteurId === userId ||
      (
        await this.prisma.employe.findUnique({
          where: { id: userId },
        })
      )?.role === 'ADMIN';

    if (!isAuthorized) {
      throw new ForbiddenException(
        'Non autorisé à supprimer cette pièce jointe',
      );
    }

    // Supprimer le fichier physique
    try {
      const filePath = join(process.cwd(), 'uploads', pieceJointe.chemin);
      if (existsSync(filePath)) {
        unlinkSync(filePath);
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du fichier:', error);
    }

    // Supprimer l'entrée en base de données
    await this.prisma.pieceJointe.delete({
      where: { id },
    });

    return { message: 'Pièce jointe supprimée avec succès' };
  }

  async getByConvocation(
    convocationId: string,
  ): Promise<PieceJointeResponseDto[]> {
    const piecesJointes = await this.prisma.pieceJointe.findMany({
      where: { convocationId },
    });

    return piecesJointes.map((pj) => ({
      id: pj.id,
      nomFichier: pj.nomFichier,
      typeMime: pj.typeMime,
      taille: pj.taille,
      url: `/pieces-jointes/${pj.id}/download`,
      convocationId: pj.convocationId,
      dateCreation: pj.dateUpload, // Utilisation de dateUpload au lieu de dateCreation
    }));
  }
}
