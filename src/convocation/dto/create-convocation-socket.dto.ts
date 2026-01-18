import { IsString, IsOptional, IsArray, IsDateString, IsEnum } from 'class-validator';
import { PrioriteConvocation } from '@prisma/client';

export class CreateConvocationSocketDto {
  @IsString()
  titre: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  dateConvocation: string;

  @IsOptional()
  @IsString()
  heureDebut?: string;

  @IsOptional()
  @IsString()
  heureFin?: string;

  @IsString()
  lieu: string;

  @IsOptional()
  @IsEnum(PrioriteConvocation)
  priorite?: PrioriteConvocation;

  @IsArray()
  participants: { employeId: string }[];

  @IsOptional()
  avecChat?: boolean;
}
