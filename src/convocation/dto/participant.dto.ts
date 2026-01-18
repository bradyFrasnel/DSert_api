// src/convocation/dto/participant.dto.ts
import { IsUUID, IsString, IsOptional, IsDate } from 'class-validator';

export class CreateParticipantDto {
  @IsUUID()
  employeId: string;

  @IsString()
  @IsOptional()
  statut?: string;

  @IsDate()
  @IsOptional()
  dateLecture?: Date;

  @IsString()
  @IsOptional()
  remarque?: string;
}

export class UpdateParticipantDto {
  @IsString()
  @IsOptional()
  statut?: string;

  @IsDate()
  @IsOptional()
  dateLecture?: Date;

  @IsString()
  @IsOptional()
  remarque?: string;
}
