import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateDepartementDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nom: string;
}