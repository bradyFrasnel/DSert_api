import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query, Put, UsePipes, ValidationPipe } from '@nestjs/common';
import { ConvocationService } from './convocation.service';
import { CreateConvocationDto } from './dto/create-convocation.dto';
import { UpdateConvocationDto } from './dto/update-convocation.dto';
import { CreateParticipantDto } from './dto/participant.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { Role } from '@prisma/client';
import { ManagerConvocationGuard } from './guards/manager-convocation.guards';

@ApiTags('convocations')
@ApiBearerAuth()
@Controller('convocations')
@UseGuards(JwtAuthGuard)
export class ConvocationController {
  constructor(private readonly convocationService: ConvocationService) {}

  // requête pour créer une convocation.
  @Post()
  @UseGuards(RolesGuard, ManagerConvocationGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  async create(@Body() createConvocationDto: CreateConvocationDto, @Request() req) {
    console.log('User object from request:', req.user); // Log pour débogage
    console.log('User ID from request:', req.user?.id); // Log pour débogage
    if (!req.user?.id) {
      throw new Error('ID utilisateur non trouvé dans le token JWT');
    }
    return this.convocationService.create(createConvocationDto, req.user.id);
  }

  // requête pour lister toutes les convocations existantes
  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER, Role.EMPLOYE)
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Request() req
  ) {
    return this.convocationService.findAll(
      Number(page),
      Number(limit),
      { userId: req.user.id, role: req.user.role }
    );
  }

  // requête pour trouver une convocation spécifique
  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER, Role.EMPLOYE)
  async findOne(@Param('id') id: string) {
    return this.convocationService.findOne(id);
  }

  // requête pour mettre à jour une convocation
  @Patch(':id')
  @UseGuards(RolesGuard, ManagerConvocationGuard)
  @Roles(Role.ADMIN, Role.MANAGER, Role.EMPLOYE)
  async update(
    @Param('id') id: string,
    @Body() updateConvocationDto: UpdateConvocationDto,
    @Request() req
  ) {
    return this.convocationService.update(id, updateConvocationDto, req.user.userId);
  }

  // requête pour supprimer une convocation
  @Delete(':id')
  @UseGuards(RolesGuard, ManagerConvocationGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  async remove(@Param('id') id: string, @Request() req) {
    return this.convocationService.remove(id, req.user.userId);
  }

  // requête pour ajouter des participants à une convocation
  @Post(':id/participants')
  @UseGuards(RolesGuard, ManagerConvocationGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  async addParticipants(
    @Param('id') id: string,
    @Body() participants: CreateParticipantDto[],
    @Request() req
  ) {
    return this.convocationService.addParticipants(id, participants, req.user.userId);
  }

  // requête pour supprimer un participant d'une convocation
  @Delete(':id/participants/:participantId')
  @UseGuards(RolesGuard, ManagerConvocationGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  async removeParticipant(
    @Param('id') id: string,
    @Param('participantId') participantId: string,
    @Request() req
  ) {
    return this.convocationService.removeParticipant(id, participantId, req.user.userId);
  }

@Put(':id/status')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.MANAGER, Role.EMPLOYE)
@UsePipes(new ValidationPipe({ transform: true }))
async updateStatus(
  @Param('id') id: string,
  @Body() updateStatusDto: { statut: string; remarque?: string },
  @Request() req
) {
  // Seul un participant peut mettre à jour son propre statut
  if (req.user.role === 'EMPLOYE') {
    return this.convocationService.updateParticipantStatus(
      id,
      req.user.id, // L'ID de l'utilisateur connecté
      updateStatusDto.statut,
      updateStatusDto.remarque
    );
  }

  // Les admins/managers peuvent mettre à jour le statut de n'importe quel participant
  // via la route existante de mise à jour
  return this.convocationService.update(id, {
    participants: [{
      employeId: req.body.participantId || req.user.id,
      statut: updateStatusDto.statut,
      remarque: updateStatusDto.remarque
    }]
  }, req.user.id);
}
}
