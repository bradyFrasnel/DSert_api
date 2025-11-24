// src/employe/dto/create-employe.dto.ts

import { IsEmail, IsNotEmpty, IsString, IsInt, IsIn } from 'class-validator';

export class CreateEmployeDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  mot_de_passe: string;

  @IsString()
  @IsNotEmpty()
  nom_famille: string;

  @IsString()
  @IsNotEmpty()
  prenom: string;

  @IsString()
  @IsIn(['admin', 'manager', 'employe'])
  role: 'admin' | 'manager' | 'employe';

  @IsInt()
  @IsNotEmpty()
  departementId: number;
}