import { IsString, IsEmail, IsNotEmpty, IsStrongPassword, MinLength, MaxLength, Matches, IsDate, IsIn } from 'class-validator';

// Le rôle par défaut sera 'employe'
// Nous n'incluons pas de rôle ici car il sera fixé à 'employe' dans le service d'auth
export class RegisterDto {
  @IsString()
  @IsEmail({}, { message: 'Format d\'email invalide' })
  @IsNotEmpty({ message: 'L\'email est obligatoire' })
  email: string;

  // @IsDate({},)
  // @IsNotEmpty({ message: 'Le role est obligatoire' })
  @IsString()
  @IsIn(['admin', 'manager', 'employe'])
  role: 'employe' | 'manager' | 'admin';

  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le nom est obligatoire' })
  @MinLength(2, { message: 'Le nom doit contenir au moins 2 caractères' })
  @MaxLength(50, { message: 'Le nom ne peut pas dépasser 50 caractères' })
  nomFamille: string;

  @IsString({ message: 'Le prénom doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le prénom est obligatoire' })
  @MinLength(2, { message: 'Le prénom doit contenir au moins 2 caractères' })
  @MaxLength(50, { message: 'Le prénom ne peut pas dépasser 50 caractères' })
  prenom: string;

  @IsString({ message: 'Le mot de passe doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le mot de passe est obligatoire' })
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
  @MaxLength(100, { message: 'Le mot de passe ne peut pas dépasser 100 caractères' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/,
    {
      message:
        'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial',
    },
  )
  password: string;
  // nomFamille: any;
  // role: any;
}