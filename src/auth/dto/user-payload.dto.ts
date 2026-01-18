import { IsString, IsEmail, IsNotEmpty } from 'class-validator';

export class UserPayloadDto {
  @IsString()
  @IsNotEmpty()
  id: string; // ID de l'employé

  @IsString()
  nomFamille: string;

  @IsString()
  prenom: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  role: 'admin' | 'manager' | 'employe';
}
