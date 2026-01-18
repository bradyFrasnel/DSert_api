import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsArray,
  IsEnum,
  IsUUID,
  MaxLength,
  MinLength,
  IsBoolean,
  ValidateNested,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

// Copie de l'enum depuis le schéma Prisma car il n'est pas encore disponible
// dans le client Prisma généré
import { PrioriteConvocation as PrismaPriorite } from '@prisma/client';

export enum PrioriteConvocation {
  BASSE = 'BASSE',
  NORMALE = 'NORMALE',
  HAUTE = 'HAUTE',
}

// Type utilitaire pour convertir entre les enums
export function toPrismaPriorite(
  priorite: PrioriteConvocation,
): PrismaPriorite {
  return priorite as unknown as PrismaPriorite;
}

export class CreateParticipantDto {
  @IsUUID()
  @IsNotEmpty()
  employeId: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  remarque?: string;
}

export class CreateConvocationDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(5, { message: 'Le titre doit contenir au moins 5 caractères' })
  @MaxLength(100, { message: 'Le titre ne peut pas dépasser 100 caractères' })
  titre: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000, {
    message: 'La description ne peut pas dépasser 1000 caractères',
  })
  description: string;

  @IsDateString()
  @IsNotEmpty()
  date_convocation: Date | string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "Le format de l'heure doit être HH:MM (ex: 14:30)",
  })
  heure_debut: string;

  @IsString()
  @IsOptional()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "Le format de l'heure doit être HH:MM (ex: 16:45)",
  })
  heure_fin?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  lieu: string;

  @IsEnum(PrioriteConvocation, {
    message: `La priorité doit être l'une des valeurs suivantes: ${Object.values(PrioriteConvocation).join(', ')}`,
  })
  @IsOptional()
  priorite?: PrioriteConvocation = PrioriteConvocation.NORMALE;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateParticipantDto)
  participants: CreateParticipantDto[];

  @IsBoolean()
  @IsOptional()
  avecChat?: boolean = true;

  @IsArray()
  @IsOptional()
  @IsUUID(undefined, {
    each: true,
    message: 'Chaque ID de pièce jointe doit être un UUID valide',
  })
  piecesJointes?: string[] = [];
  employeConvoqueId: any;
}
