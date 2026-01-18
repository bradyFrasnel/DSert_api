import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDepartementDto } from './dto/create-departement.dto';
import { UpdateDepartementDto } from './dto/update-departement.dto';

@Injectable()
export class DepartementService {
  constructor(private prisma: PrismaService) {}

  // fonction pour creer un departement
  async create(createDepartementDto: CreateDepartementDto) {
    return this.prisma.departement.create({
      data: createDepartementDto,
    });
  }

  // fonction pour trouver tous les departements existants
  async findAll() {
    return this.prisma.departement.findMany({
      orderBy: { nom: 'asc' },
    });
  }
  // fonction pour trouver un departement existant
  async findOne(id: number) {
    const departement = await this.prisma.departement.findUnique({
      where: { id },
    });

    if (!departement) {
      throw new NotFoundException(`Département avec l'ID "${id}" non trouvé`);
    }

    return departement;
  }
  // fonction pour mettre a jour un departement existant
  async update(id: number, updateDepartementDto: UpdateDepartementDto) {
    await this.findOne(id); // Vérifie si le département existe

    return this.prisma.departement.update({
      where: { id },
      data: updateDepartementDto,
    });
  }

  // fonction pour supprimer un departement existant
  async remove(id: number) {
    await this.findOne(id); // Vérifie si le département existe

    return this.prisma.departement.delete({
      where: { id },
    });
  }
}
