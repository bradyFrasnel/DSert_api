// src/employe/employe.service.ts

import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateEmployeDto } from './dto/create-employe.dto';
import { UpdateEmployeDto } from './dto/update-employe.dto';
import { Employe, Role } from '@prisma/client';

@Injectable()
export class EmployeService {
  async findByDepartment(departementId: number): Promise<Employe[]> {
    return this.prisma.employe.findMany({
      where: { 
        departementId,
        actif: true 
      },
      include: { departement: true }
    });
  }
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService
  ) {}

  private get saltRounds(): number {
    return this.configService.get<number>('SALT_ROUNDS') || 10;
  }

  // Fonction de hachage de mot de passe
  private async hashMotDePasse(motDePasse: string): Promise<string> {
    return bcrypt.hash(motDePasse, this.saltRounds);
  }

  // Création d'un employé
  async create(createEmployeDto: CreateEmployeDto): Promise<Employe> {
    // Vérifier si l'email existe déjà
    const existingEmploye = await this.findOneByEmail(createEmployeDto.email);
    if (existingEmploye) {
      throw new ConflictException('Un employé avec cet email existe déjà');
    }

    const hashedPassword = await this.hashMotDePasse(createEmployeDto.motDePasse);
    
    return this.prisma.employe.create({
      data: {
        ...createEmployeDto,
        motDePasse: hashedPassword,
        role: createEmployeDto.role || Role.EMPLOYE,
      },
      include: {
        departement: true
      }
    });
  }

  // Récupérer tous les employés avec pagination
  async findAll(skip = 0, take = 10): Promise<{data: Employe[], total: number}> {
    const [data, total] = await Promise.all([
      this.prisma.employe.findMany({
        skip,
        take,
        include: { departement: true },
        orderBy: { dateEmbauche: 'desc' }
      }),
      this.prisma.employe.count()
    ]);

    return { data, total };
  }

  // Trouver un employé par son ID avec son département
  async findOneById(id: string): Promise<Employe | null> {
    return this.prisma.employe.findUnique({
      where: { id },
      include: { departement: true }
    });
  }

  // Trouver un employé par son email
  async findOneByEmail(email: string): Promise<Employe | null> {
    return this.prisma.employe.findUnique({
      where: { email },
      include: { departement: true }
    });
  }

  // Mettre à jour un employé
  async update(id: string, updateEmployeDto: UpdateEmployeDto): Promise<Employe> {
    const data: any = { ...updateEmployeDto };
    
    // Si le mot de passe est fourni, le hacher
    if (updateEmployeDto.motDePasse) {
      data.motDePasse = await this.hashMotDePasse(updateEmployeDto.motDePasse);
    }

    return this.prisma.employe.update({
      where: { id },
      data,
      include: { departement: true }
    });
  }

  // Supprimer un employé (soft delete)
  async remove(id: string): Promise<Employe> {
    return this.prisma.employe.update({
      where: { id },
      data: { actif: false },
      include: { departement: true }
    });
  }

  // Vérifier si un employé est administrateur
  async isAdmin(userId: string): Promise<boolean> {
    const user = await this.prisma.employe.findUnique({
      where: { id: userId },
      select: { role: true }
    });
    
    return user?.role === Role.ADMIN;
  }

  // Vérifier si un employé est manager d'un département
  async isDepartmentManager(userId: string, departmentId: number): Promise<boolean> {
    const user = await this.prisma.employe.findUnique({
      where: { 
        id: userId,
        role: Role.MANAGER,
        departementId: departmentId
      }
    });
    
    return !!user;
  }
}