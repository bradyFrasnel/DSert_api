import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { ConvocationService } from './convocation.service';
import { CreateConvocationDto } from './dto/create-convocation.dto';
import { UpdateConvocationDto } from './dto/update-convocation.dto';
import { CreateParticipantDto } from './dto/participant.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('convocations')
@ApiBearerAuth()
@Controller('convocations')
@UseGuards(JwtAuthGuard)
export class ConvocationController {
  constructor(private readonly convocationService: ConvocationService) {}

  @Post()
  async create(@Body() createConvocationDto: CreateConvocationDto, @Request() req) {
    return this.convocationService.create(createConvocationDto, req.user.userId);
  }

  @Get()
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
      { userId: req.user.userId, role: req.user.role }
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.convocationService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateConvocationDto: UpdateConvocationDto,
    @Request() req
  ) {
    return this.convocationService.update(id, updateConvocationDto, req.user.userId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    return this.convocationService.remove(id, req.user.userId);
  }

  @Post(':id/participants')
  async addParticipants(
    @Param('id') id: string,
    @Body() participants: CreateParticipantDto[],
    @Request() req
  ) {
    return this.convocationService.addParticipants(id, participants, req.user.userId);
  }

  @Delete(':id/participants/:participantId')
  async removeParticipant(
    @Param('id') id: string,
    @Param('participantId') participantId: string,
    @Request() req
  ) {
    return this.convocationService.removeParticipant(id, participantId, req.user.userId);
  }
}
