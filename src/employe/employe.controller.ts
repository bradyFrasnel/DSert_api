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
  NotFoundException 
} from '@nestjs/common';
import { EmployeService } from './employe.service';
import type { CreateEmployeDto } from './dto/create-employe.dto';
import type { UpdateEmployeDto } from './dto/update-employe.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import type { Employe } from '@prisma/client';
import { Role } from '@prisma/client';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('employes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmployeController {
  constructor(private readonly employeService: EmployeService) {}

  @Post()
  @Roles(Role.ADMIN)
  async create(@Body() createEmployeDto: CreateEmployeDto) {
    return this.employeService.create(createEmployeDto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER)
  async findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @GetUser() user: Omit<Employe, 'mot_de_passe'>
  ) {
    // Les managers ne peuvent voir que les employés de leur département
    if (user.role === Role.MANAGER) {
      const employes = await this.employeService.findByDepartment(user.departementId);
      return { 
        data: employes, 
        total: employes.length,
        page: 1,
        limit: employes.length
      };
    }

    // Les admins voient tous les employés avec pagination
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);
    return this.employeService.findAll(skip, take);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  async findOne(@Param('id') id: string, @GetUser() user: Employe) {
    const employe = await this.employeService.findOneById(id);
    
    if (!employe) {
      throw new NotFoundException('Employé non trouvé');
    }
    
    // Un manager ne peut voir que les employés de son département
    if (user.role === Role.MANAGER && employe.departementId !== user.departementId) {
      throw new ForbiddenException('Accès non autorisé à cette ressource');
    }
    
    return employe;
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  async update(
    @Param('id') id: string,
    @Body() updateEmployeDto: UpdateEmployeDto,
    @GetUser() user: Omit<Employe, 'mot_de_passe'>
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
        throw new ForbiddenException('Vous n\'êtes pas autorisé à modifier le rôle ou le département');
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
    @GetUser() user: Omit<Employe, 'mot_de_passe'>
  ) {
    // Un manager ne peut voir que les employés de son département
    if (user.role === Role.MANAGER && departementId !== user.departementId) {
      throw new ForbiddenException('Accès non autorisé à cette ressource');
    }

    return this.employeService.findByDepartment(departementId);
  }
}