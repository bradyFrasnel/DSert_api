// src/employe/employe.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
  ForbiddenException,
  NotFoundException,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { EmployeService } from './employe.service';
import type { CreateEmployeDto } from './dto/create-employe.dto';
import type { UpdateEmployeDto } from './dto/update-employe.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import type { Employe } from '@prisma/client';
import { Role } from '@prisma/client';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('employes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmployeController {
  constructor(private readonly employeService: EmployeService) {}

  // c'est ici que l'on va mettre le code pour uploader (ajouter) une photo de profil
  @Post(':id/photo')
  @UseInterceptors(FileInterceptor('file'))
  @Roles(Role.ADMIN, Role.MANAGER, Role.EMPLOYE)
  async uploadProfilePhoto(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @GetUser() user: any,
  ) {
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni');
    }

    // Vérifier que l'utilisateur a le droit de modifier ce profil
    if (user.role !== Role.ADMIN && user.id !== id) {
      throw new ForbiddenException(
        "Vous n'êtes pas autorisé à modifier ce profil",
      );
    }

    // Vérifier le type de fichier
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Type de fichier non pris en charge. Veuillez télécharger une image (JPEG, PNG)',
      );
    }

    // Vérifier la taille du fichier (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException(
        'La taille du fichier ne doit pas dépasser 5MB',
      );
    }

    try {
      const employe = await this.employeService.updateProfileImage(id, file);
      return {
        message: 'Photo de profil mise à jour avec succès',
        photoUrl: employe.photoProfil,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException('Employé non trouvé');
      }
      throw new BadRequestException(
        'Erreur lors de la mise à jour de la photo de profil',
      );
    }
  }

  @Post()
  @Roles(Role.ADMIN)
  async create(@Body() createEmployeDto: CreateEmployeDto) {
    return this.employeService.create(createEmployeDto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER, Role.EMPLOYE)
  async findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @GetUser() user: Omit<Employe, 'password'>,
  ) {
    // Les managers ne peuvent voir que les employés de leur département
    if (user.role === Role.MANAGER || user.role === Role.EMPLOYE) {
      const employes = await this.employeService.findByDepartment(
        user.departementId,
      );
      return {
        data: employes,
        total: employes.length,
        page: 1,
        limit: employes.length,
      };
    }

    // Les admin voient tous les employés avec pagination
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);
    return this.employeService.findAll(skip, take);
  }

  //rechercher un employe grâce à son Id
  @Get(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.EMPLOYE)
  async findOne(@Param('id') id: string, @GetUser() user: Employe) {
    const employe = await this.employeService.findOneById(id);

    if (!employe) {
      throw new NotFoundException('Employé non trouvé');
    }

    // Un manager ne peut voir que les employés de son département
    if (
      user.role === Role.MANAGER &&
      employe.departementId !== user.departementId
    ) {
      throw new ForbiddenException('Accès non autorisé à cette ressource');
    }

    return employe;
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  async update(
    @Param('id') id: string,
    @Body() updateEmployeDto: UpdateEmployeDto,
    @GetUser() user: Omit<Employe, 'password'>,
  ) {
    // Vérifier si l'employé existe
    const existingEmploye = await this.employeService.findOneById(id);
    if (!existingEmploye) {
      throw new NotFoundException('Employé non trouvé');
    }

    // Vérifier les permissions
    if (user.role === Role.MANAGER) {
      if (existingEmploye.departementId !== user.departementId) {
        throw new ForbiddenException('Accès non autorisé à cette ressource');
      }
      // Un manager ne peut pas modifier le rôle ou le département
      if (updateEmployeDto.role || updateEmployeDto.departementId) {
        throw new ForbiddenException(
          "Vous n'êtes pas autorisé à modifier le rôle ou le département",
        );
      }
    }

    return this.employeService.update(id, updateEmployeDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  async remove(@Param('id') id: string, @GetUser() user: Employe) {
    // Vérifier si l'employé existe
    const existingEmploye = await this.employeService.findOneById(id);
    if (!existingEmploye) {
      throw new NotFoundException('Employé non trouvé');
    }

    // Vérifier les permissions
    if (user.role === Role.MANAGER) {
      if (existingEmploye.departementId !== user.departementId) {
        throw new ForbiddenException('Accès non autorisé à cette ressource');
      }
    }

    return this.employeService.remove(id);
  }

  @Get('departement/:departementId')
  @Roles(Role.ADMIN, Role.MANAGER)
  async findByDepartment(
    @Param('departementId', ParseIntPipe) departementId: number,
    @GetUser() user: Omit<Employe, 'password'>,
  ) {
    // Un manager ne peut voir que les employés de son département
    if (user.role === Role.MANAGER && departementId !== user.departementId) {
      throw new ForbiddenException('Accès non autorisé à cette ressource');
    }

    return this.employeService.findByDepartment(departementId);
  }
}
