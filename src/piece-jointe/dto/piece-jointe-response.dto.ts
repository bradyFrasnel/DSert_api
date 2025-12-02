import { ApiProperty } from '@nestjs/swagger';

export class PieceJointeResponseDto {
  @ApiProperty({ description: 'ID unique de la pièce jointe' })
  id: string;

  @ApiProperty({ description: 'Nom original du fichier' })
  nomFichier: string;

  @ApiProperty({ description: 'Type MIME du fichier' })
  typeMime: string;

  @ApiProperty({ description: 'Taille du fichier en octets' })
  taille: number;

  @ApiProperty({ description: 'URL de téléchargement du fichier' })
  url: string;

  @ApiProperty({ description: 'ID de la convocation associée' })
  convocationId: string;

  @ApiProperty({ description: 'Date de création' })
  dateCreation: Date;
}
