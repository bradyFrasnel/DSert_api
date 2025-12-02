import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

// Clé utilisée pour stocker les métadonnées de rôle
export const ROLES_KEY = 'roles';

// Décorateur personnalisé pour spécifier les rôles autorisés sur une route
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
