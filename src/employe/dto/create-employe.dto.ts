// src/employe/dto/create-employe.dto.ts

import { IsEmail, IsNotEmpty, IsString, IsInt, IsEnum } from 'class-validator';
import { Role } from '@prisma/client';

export class CreateEmployeDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  nomFamille: string;

  @IsString()
  @IsNotEmpty()
  prenom: string;

  @IsEnum(Role)
  @IsNotEmpty()
  role: Role;

  @IsInt()
  @IsNotEmpty()
  departementId: number;
}
