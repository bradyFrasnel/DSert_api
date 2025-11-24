import { 
  IsString, 
  IsDate, 
  IsEnum, 
  IsArray, 
  IsBoolean, 
  IsUUID,
  IsOptional,
  IsNumber
} from 'class-validator';
import { Type } from 'class-transformer';
import { PrioriteConvocation } from './create-convocation.dto';

// Décoration ApiProperty optionnelle (si @nestjs/swagger n'est pas installé)
function ApiProperty(metadata: any): PropertyDecorator {
  return (target: Object, propertyKey: string | symbol) => {};
}

export class ParticipantResponseDto {
  @ApiProperty({ description: 'ID du participant' })
  @IsUUID()
  employeId: string;

  @ApiProperty({ description: 'Nom de famille du participant' })
  @IsString()
  nom: string;

  @ApiProperty({ description: 'Prénom du participant' })
  @IsString()
  prenom: string;

  @ApiProperty({ description: 'Email du participant' })
  @IsString()
  email: string;

  @ApiProperty({ 
    description: 'Statut de la convocation pour ce participant',
    enum: ['envoye', 'lu', 'accepte', 'refuse', 'annule']
  })
  @IsString()
  statut: string;

  @ApiProperty({ description: 'Date de lecture de la convocation', required: false })
  @IsDate()
  @IsOptional()
  dateLecture?: Date;

  @ApiProperty({ description: 'Remarques éventuelles', required: false })
  @IsString()
  @IsOptional()
  remarque?: string;
}

export class ConvocationResponseDto {
  @ApiProperty({ description: 'ID unique de la convocation' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'Titre de la convocation' })
  @IsString()
  titre: string;

  @ApiProperty({ description: 'Description détaillée' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Date de la convocation' })
  @IsDate()
  date_convocation: Date;

  @ApiProperty({ description: 'Heure de début (format HH:MM)' })
  @IsString()
  heure_debut: string;

  @ApiProperty({ description: 'Heure de fin (format HH:MM)', required: false })
  @IsString()
  @IsOptional()
  heure_fin?: string;

  @ApiProperty({ description: 'Lieu de la convocation' })
  @IsString()
  lieu: string;

  @ApiProperty({ 
    description: 'Niveau de priorité',
    enum: PrioriteConvocation,
    default: PrioriteConvocation.NORMALE
  })
  @IsEnum(PrioriteConvocation)
  priorite: PrioriteConvocation;

  @ApiProperty({ description: 'Date de création de la convocation' })
  @IsDate()
  date_creation: Date;

  @ApiProperty({ description: 'Date de dernière mise à jour' })
  @IsDate()
  date_mise_a_jour: Date;

  @ApiProperty({ description: 'Indique si la convocation est annulée' })
  @IsBoolean()
  est_annulee: boolean;

  @ApiProperty({ description: 'ID de l\'émetteur de la convocation' })
  @IsUUID()
  emetteurId: string;

  @ApiProperty({ description: 'Nom de l\'émetteur' })
  @IsString()
  emetteurNom: string;

  @ApiProperty({ description: 'Prénom de l\'émetteur' })
  @IsString()
  emetteurPrenom: string;

  @ApiProperty({ 
    description: 'ID de la conversation associée, si elle existe',
    required: false 
  })
  @IsUUID()
  @IsOptional()
  conversationId?: string;

  @ApiProperty({ 
    description: 'Indique si un chat est associé à cette convocation',
    default: true 
  })
  @IsBoolean()
  avecChat: boolean;

  @ApiProperty({ 
    description: 'Liste des participants avec leur statut',
    type: [ParticipantResponseDto] 
  })
  @IsArray()
  participants: ParticipantResponseDto[];

  @ApiProperty({ 
    description: 'Liste des IDs des pièces jointes',
    type: [String],
    required: false
  })
  @IsArray()
  @IsUUID(undefined, { each: true })
  @IsOptional()
  piecesJointes?: string[];
}

export class ConvocationListResponseDto {
  @ApiProperty({ description: 'Liste des convocations', type: [ConvocationResponseDto] })
  @IsArray()
  data: ConvocationResponseDto[];

  @ApiProperty({ description: 'Nombre total de convocations' })
  @IsNumber()
  total: number;

  @ApiProperty({ description: 'Numéro de la page actuelle' })
  @IsNumber()
  page: number;

  @ApiProperty({ description: 'Nombre total de pages' })
  @IsNumber()
  totalPages: number;
}
