// src/convocation/dto/update-status.dto.ts
import { IsString, IsIn, IsOptional, IsNotEmpty } from 'class-validator';

export class UpdateStatusDto {
  @IsString()
  @IsIn(['ENVOYE', 'LU', 'ACCEPTE', 'REFUSE', 'ANNULE'], {
    message: 'Le statut doit être l\'un des suivants: ENVOYE, LU, ACCEPTE, REFUSE, ANNULE'
  })
  @IsNotEmpty()
  statut: string;

  @IsString()
  @IsOptional()
  remarque?: string;
}