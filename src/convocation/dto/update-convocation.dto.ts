import { 
  IsOptional,
  IsArray,
  IsUUID,
  ValidateNested,
  IsBoolean,
  IsString,
  IsEnum,
  MaxLength
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateConvocationDto, CreateParticipantDto } from './create-convocation.dto';

// Fonctions utilitaires pour simuler PartialType et OmitType de @nestjs/mapped-types
const PartialType = <T>(cls: new () => T): new () => Partial<T> => class {} as any;
const OmitType = <T, K extends keyof T>(cls: new () => T, keys: readonly K[]): new () => Omit<T, typeof keys[number]> => class {} as any;

// Enum local pour la validation (correspond aux valeurs de Prisma)
export enum StatutConvocationEnum {
  ENVOYE = 'ENVOYE',
  LU = 'LU',
  ACCEPTE = 'ACCEPTE',
  REFUSE = 'REFUSE',
  ANNULE = 'ANNULE'
}

/**
 * DTO pour mettre à jour un participant d'une convocation
 * employeId est obligatoire pour identifier le participant
 * statut et remarque sont optionnels
 */
export class UpdateParticipantDto {
  @IsUUID()
  employeId: string;

  @IsOptional()
  @IsEnum(StatutConvocationEnum, {
    message: 'Le statut doit être: ENVOYE, LU, ACCEPTE, REFUSE ou ANNULE'
  })
  statut?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  remarque?: string;
}

export class UpdateConvocationDto extends PartialType(
  OmitType(CreateConvocationDto, ['participants', 'piecesJointes'] as const)
) {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateParticipantDto)
  @IsOptional()
  participants?: UpdateParticipantDto[];

  @IsArray()
  @IsUUID(undefined, { each: true })
  @IsOptional()
  piecesJointesAAjouter?: string[];

  @IsArray()
  @IsUUID(undefined, { each: true })
  @IsOptional()
  piecesJointesASupprimer?: string[];

  @IsBoolean()
  @IsOptional()
  annuler?: boolean;

  @IsString()
  @IsOptional()
  motifAnnulation?: string;
}