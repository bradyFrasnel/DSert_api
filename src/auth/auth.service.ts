// src/auth/auth.service.ts

import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { EmployeService } from '../employe/employe.service';
import { RegisterDto } from './dto/register.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly employeService: EmployeService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    try {
      const employe = await this.employeService.findOneByEmail(email);
      
      if (!employe) {
        return null;
      }

      const isPasswordValid = await bcrypt.compare(password, employe.mot_de_passe);

      if (!isPasswordValid) {
        return null;
      }

      // Retourne l'objet employé sans le mot de passe
      const { mot_de_passe, ...result } = employe;
      return result;
    } catch (error) {
      throw new UnauthorizedException('Erreur lors de la validation des identifiants');
    }
  }

  async login(employe: any) {
    try {
      const payload = {
        email: employe.email,
        sub: employe.id,
        role: employe.role,
      };

      return {
        access_token: this.jwtService.sign(payload),
        employe: {
          id: employe.id,
          email: employe.email,
          role: employe.role,
        },
      };
    } catch (error) {
      throw new UnauthorizedException('Erreur lors de la génération du token');
    }
  }

  async register(registerDto: RegisterDto) {
    // Vérifier si l'email est déjà utilisé
    const existingUser = await this.employeService.findOneByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Un compte avec cet email existe déjà');
    }

    try {
      // Récupérer le département par défaut (par exemple, le premier département disponible)
      const defaultDepartment = await this.prisma.departement.findFirst();
      
      if (!defaultDepartment) {
        // eslint-disable-next-line prettier/prettier
        throw new BadRequestException('Aucun département trouvé. Veuillez d\'abord créer un département.');
      }

      // Créer le nouvel employé avec le rôle 'employe' par défaut
      const hashedPassword = await bcrypt.hash(registerDto.mot_de_passe, 10);
      
      const newEmploye = await this.prisma.employe.create({
        data: {
          email: registerDto.email,
          mot_de_passe: hashedPassword,
          nom_famille: registerDto.nom_famille,
          prenom: registerDto.prenom,
          role: 'EMPLOYE', // Rôle par défaut
          departementId: defaultDepartment.id,
        },
        select: {
          id: true,
          email: true,
          nom_famille: true,
          prenom: true,
          role: true,
          departementId: true,
        },
      });

      // Générer le token JWT
      const payload = {
        email: newEmploye.email,
        sub: newEmploye.id,
        role: newEmploye.role,
      };

      return {
        access_token: this.jwtService.sign(payload),
        employe: newEmploye,
      };
    } catch (error) {
      console.error("Erreur lors de l'inscription:", error);
      throw new BadRequestException("Erreur lors de l'inscription");
    }
  }
}
