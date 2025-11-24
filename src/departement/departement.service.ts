import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDepartementDto } from './dto/create-departement.dto';
import { UpdateDepartementDto } from './dto/update-departement.dto';

@Injectable()
export class DepartementService {
  constructor(private prisma: PrismaService) {}

  async create(createDepartementDto: CreateDepartementDto) {
    return this.prisma.departement.create({
      data: createDepartementDto,
    });
  }

  async findAll() {
    return this.prisma.departement.findMany({
      orderBy: { nom: 'asc' },
    });
  }

  async findOne(id: number) {
    const departement = await this.prisma.departement.findUnique({
      where: { id },
    });

    if (!departement) {
      throw new NotFoundException(`Département avec l'ID "${id}" non trouvé`);
    }

    return departement;
  }

  async update(id: number, updateDepartementDto: UpdateDepartementDto) {
    await this.findOne(id); // Vérifie si le département existe

    return this.prisma.departement.update({
      where: { id },
      data: updateDepartementDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id); // Vérifie si le département existe

    return this.prisma.departement.delete({
      where: { id },
    });
  }
}