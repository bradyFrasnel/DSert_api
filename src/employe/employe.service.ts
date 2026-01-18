// src/employe/employe.service.ts

import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateEmployeDto } from './dto/create-employe.dto';
import { UpdateEmployeDto } from './dto/update-employe.dto';
import { Role, Employe as EmployeModel } from '@prisma/client';
import { StorageService } from '../shared/storage/storage.service';
import { ImageProcessorService } from '../shared/utils/image-processor.service';

// Type pour l'employé avec les relations
type EmployeWithRelations = EmployeModel & {
  departement?: any; // Type à remplacer par le type correct du département si disponible
  photoProfil?: string | null;
  password?: string;
  nom_famille?: string;
  date_embauche?: Date;
  date_sortie?: Date | null;
};

@Injectable()
export class EmployeService {
  async findByDepartment(
    departementId: number,
  ): Promise<EmployeWithRelations[]> {
    const employes = await this.prisma.employe.findMany({
      where: {
        departementId,
        actif: true,
      },
      include: { departement: true },
    });

    // Ajouter l'URL complète pour chaque photo de profil
    const employesWithPhotoUrl = await Promise.all(
      employes.map(async (employe) => ({
        ...employe,
        photoProfil: (employe as any).photoProfil
          ? await this.getProfilePhotoUrl((employe as any).photoProfil)
          : null,
      })),
    );

    return employesWithPhotoUrl;
  }

  private readonly PROFILE_IMAGE_MAX_SIZE = 5 * 1024 * 1024; // 5MB
  private readonly ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png'];

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private readonly storageService: StorageService,
    private readonly imageProcessor: ImageProcessorService,
  ) {}

  private get saltRounds(): number {
    return this.configService.get<number>('SALT_ROUNDS') || 10;
  }

  // Fonction de hachage de mot de passe
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  async updateProfileImage(
    employeId: string,
    file: Express.Multer.File,
  ): Promise<EmployeWithRelations> {
    // Vérifier si l'employé existe
    const existingEmploye = await this.prisma.employe.findUnique({
      where: { id: employeId },
    });

    if (!existingEmploye) {
      throw new NotFoundException('Employé non trouvé');
    }

    // Valider le type et la taille du fichier
    if (!this.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        'Type de fichier non supporté. Utilisez JPEG ou PNG.',
      );
    }

    if (file.size > this.PROFILE_IMAGE_MAX_SIZE) {
      throw new BadRequestException(
        `La taille du fichier ne doit pas dépasser ${this.PROFILE_IMAGE_MAX_SIZE / (1024 * 1024)}MB`,
      );
    }

    // Traiter l'image (redimensionnement et optimisation)
    const processedImage = await this.imageProcessor.processImage(file);

    // Créer un nouveau fichier avec l'image traitée
    const processedFile = {
      ...file,
      buffer: processedImage.buffer,
      size: processedImage.size,
      mimetype: `image/${processedImage.format}`,
      originalname: `profile_${Date.now()}.${processedImage.format}`,
    } as Express.Multer.File;

    // Supprimer l'ancienne photo si elle existe
    const oldPhotoPath = (existingEmploye as any).photoProfil;
    if (oldPhotoPath) {
      try {
        await this.storageService.delete(oldPhotoPath);
      } catch (error) {
        console.error(
          "Erreur lors de la suppression de l'ancienne image",
          error,
        );
      }
    }

    // Télécharger la nouvelle photo traitée
    const path = await this.storageService.upload(processedFile, 'profiles');

    // Mettre à jour l'employé avec le nouveau chemin de la photo
    await this.prisma.$executeRaw`
      UPDATE "Employe" 
      SET "photoProfil" = ${path}
      WHERE id = ${employeId}
    `;

    // Récupérer l'employé mis à jour avec ses relations
    const updatedEmploye = await this.prisma.employe.findUnique({
      where: { id: employeId },
      include: { departement: true },
    });

    // Retourner l'employé avec l'URL complète de la photo
    return {
      ...updatedEmploye,
      photoProfil: (updatedEmploye as any).photoProfil
        ? await this.getProfilePhotoUrl((updatedEmploye as any).photoProfil)
        : null,
    } as EmployeWithRelations;
  }

  // Création d'un employé
  async create(
    createEmployeDto: CreateEmployeDto,
  ): Promise<EmployeWithRelations> {
    // Vérifier si l'email existe déjà
    const existingEmploye = await this.findOneByEmail(createEmployeDto.email);
    if (existingEmploye) {
      throw new ConflictException('Un employé avec cet email existe déjà');
    }

    const hashedPassword = await this.hashPassword(createEmployeDto.password);

    const employe = await this.prisma.employe.create({
      data: {
        ...createEmployeDto,
        password: hashedPassword,
        role: createEmployeDto.role || Role.EMPLOYE,
      },
      include: {
        departement: true,
      },
    });

    return {
      ...employe,
      photoProfil: (employe as any).photoProfil
        ? this.getProfilePhotoUrl((employe as any).photoProfil)
        : null,
    } as EmployeWithRelations;
  }

  // Récupérer tous les employés avec pagination
  async findAll(
    skip = 0,
    take = 10,
  ): Promise<{ data: EmployeWithRelations[]; total: number }> {
    const [data, total] = await Promise.all([
      this.prisma.employe.findMany({
        skip,
        take,
        include: { departement: true },
        orderBy: { dateEmbauche: 'desc' },
      }),
      this.prisma.employe.count(),
    ]);

    // Ajouter l'URL complète pour chaque photo de profil
    const employesWithPhotoUrl = await Promise.all(
      data.map(async (employe) => ({
        ...employe,
        photoProfil: (employe as any).photoProfil
          ? await this.getProfilePhotoUrl((employe as any).photoProfil)
          : null,
      })),
    );

    return {
      data: employesWithPhotoUrl as EmployeWithRelations[],
      total,
    };
  }

  // Trouver un employé par son ID avec son département
  async findOneById(id: string): Promise<EmployeWithRelations | null> {
    const employe = await this.prisma.employe.findUnique({
      where: { id },
      include: { departement: true },
    });

    if (!employe) {
      return null;
    }

    return {
      ...employe,
      photoProfil: (employe as any).photoProfil
        ? await this.getProfilePhotoUrl((employe as any).photoProfil)
        : null,
    } as EmployeWithRelations;
  }

  // Obtenir l'URL complète de la photo de profil
  async getProfilePhotoUrl(
    photoPath: string | null | undefined,
  ): Promise<string | null> {
    if (!photoPath) return null;
    return await this.storageService.getUrl(photoPath);
  }

  // Trouver un employé par son email
  async findOneByEmail(email: string): Promise<EmployeWithRelations | null> {
    const employe = await this.prisma.employe.findUnique({
      where: { email },
      include: { departement: true },
    });

    if (!employe) {
      return null;
    }

    return {
      ...employe,
      photoProfil: (employe as any).photoProfil
        ? await this.getProfilePhotoUrl((employe as any).photoProfil)
        : null,
    } as EmployeWithRelations;
  }

  // Mettre à jour un employé
  async update(
    id: string,
    updateEmployeDto: UpdateEmployeDto,
  ): Promise<EmployeWithRelations> {
    const data: any = { ...updateEmployeDto };

    // Si le mot de passe est fourni, le hacher
    if (updateEmployeDto.password) {
      data.password = await this.hashPassword(updateEmployeDto.password);
    }

    const updatedEmploye = await this.prisma.employe.update({
      where: { id },
      data,
      include: { departement: true },
    });

    return {
      ...updatedEmploye,
      photoProfil: (updatedEmploye as any).photoProfil
        ? this.getProfilePhotoUrl((updatedEmploye as any).photoProfil)
        : null,
    } as EmployeWithRelations;
  }

  // Supprimer un employé (soft delete)
  async remove(id: string): Promise<EmployeWithRelations> {
    const employe = await this.prisma.employe.update({
      where: { id },
      data: { actif: false },
      include: { departement: true },
    });

    return {
      ...employe,
      photoProfil: (employe as any).photoProfil
        ? this.getProfilePhotoUrl((employe as any).photoProfil)
        : null,
    } as EmployeWithRelations;
  }

  // Vérifier si un employé est administrateur
  async isAdmin(userId: string): Promise<boolean> {
    const user = await this.prisma.employe.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    return user?.role === Role.ADMIN;
  }

  // Vérifier si un employé est manager d'un département
  async isDepartmentManager(
    userId: string,
    departmentId: number,
  ): Promise<boolean> {
    const user = await this.prisma.employe.findUnique({
      where: {
        id: userId,
        role: Role.MANAGER,
        departementId: departmentId,
      },
    });

    return !!user;
  }
}
