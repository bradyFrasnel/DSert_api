import { IsString, IsEmail, IsNotEmpty } from 'class-validator';

export class UserPayloadDto {
  @IsString()
  @IsNotEmpty()
  id: string; // ID de l'employé

  @IsEmail()
  email: string;

  @IsString()
  mot_de_passe: string;

  @IsString()
  @IsNotEmpty()
  role: 'admin' | 'manager' | 'employe'; 
}