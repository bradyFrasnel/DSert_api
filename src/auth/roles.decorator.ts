import { SetMetadata } from '@nestjs/common';
import { UserRole } from './roles.enum';

// Clé utilisée pour stocker les métadonnées de rôle
export const ROLES_KEY = 'roles';
// Décorateur personnalisé pour spécifier les rôles autorisés sur une route
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
