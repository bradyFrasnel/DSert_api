import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateConversationDto {
  @IsString()
  @IsOptional()
  nom?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsUUID(undefined, { each: true })
  @IsNotEmpty()
  participants: string[]; // IDs des employés à ajouter à la conversation

  @IsUUID()
  @IsOptional()
  convocationId?: string; // Optionnel, pour les conversations liées à une convocation
}
