import { Controller, Get, Post, Body, Param, Delete, Put, UseGuards, ParseIntPipe } from '@nestjs/common';
import { DepartementService } from './departement.service';
import { CreateDepartementDto } from './dto/create-departement.dto';
import { UpdateDepartementDto } from './dto/update-departement.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Role } from '@prisma/client';

@Controller('departements')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DepartementController {
  constructor(private readonly departementService: DepartementService) {}

  // requête pour créer un departement
  @Post()
  @Roles(Role.ADMIN)
  create(@Body() createDepartementDto: CreateDepartementDto) {
    return this.departementService.create(createDepartementDto);
  }

  // requête pour trouver tous les departements existants
  @Get()
  findAll() {
    return this.departementService.findAll();
  }

  // requête pour trouver un departement spécifique
  @Get(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.EMPLOYE)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.departementService.findOne(id);
  }

  // requête pour mettre à jour un departement spécifique
  @Put(':id')
  @Roles(Role.ADMIN)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDepartementDto: UpdateDepartementDto,
  ) {
    return this.departementService.update(id, updateDepartementDto);
  }

  // requête pour supprimer un departement spécifique
  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.departementService.remove(id);
  }
}