// src/employe/employe.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateEmployeDto } from './dto/create-employe.dto';
import { Employe } from '@prisma/client';

@Injectable()
export class EmployeService {
  constructor(private prisma: PrismaService) {}

  // Constante pour le hachage
  private readonly SALT_ROUNDS = 10;

  // Fonction de hachage de mot de passe
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  // Crée un employé (UTILISATEUR ADMIN INITIAL)
  async create(createEmployeDto: CreateEmployeDto): Promise<Employe> {
    const hashedPassword = await this.hashPassword(createEmployeDto.mot_de_passe);
    
    return this.prisma.employe.create({
      data: {
        ...createEmployeDto,
        mot_de_passe: hashedPassword,
        // S'assurer que le rôle est en majuscules
        role: createEmployeDto.role ? createEmployeDto.role.toUpperCase() as any : 'EMPLOYE',
      },
    });
  }

  // Fonction de recherche par email (essentielle pour l'authentification)
  async findOneByEmail(email: string): Promise<Employe | null> {
    return this.prisma.employe.findUnique({
      where: { email },
    });
  }

  // Fonction de recherche par ID (nécessaire pour le AuthGuard JWT)
  async findOneById(id: string): Promise<Employe | null> {
    return this.prisma.employe.findUnique({
      where: { id },
    });
  }
}