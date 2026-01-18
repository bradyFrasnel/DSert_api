import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

/**
 * DTO utilisé pour créer un nouveau message via l'événement Socket.io 'sendMessage'.
 * L'auteurId est extrait du token JWT dans le Gateway, il n'est donc pas dans ce DTO.
 */
export class CreateMessageDto {
  @IsUUID('4', { message: "L'ID de la conversation doit être un UUID valide." })
  @IsNotEmpty()
  conversationId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100000)
  contenu: string;
}
