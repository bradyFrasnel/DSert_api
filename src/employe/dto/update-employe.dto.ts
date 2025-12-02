import { PartialType } from '@nestjs/mapped-types';
import { CreateEmployeDto } from './create-employe.dto';
import { IsEmail, IsString, IsInt, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { Role } from '@prisma/client';

export class UpdateEmployeDto extends PartialType(CreateEmployeDto) {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  motDePasse?: string;

  @IsString()
  @IsOptional()
  nomFamille?: string;

  @IsString()
  @IsOptional()
  prenom?: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @IsInt()
  @IsOptional()
  departementId?: number;

  @IsBoolean()
  @IsOptional()
  actif?: boolean;
}
