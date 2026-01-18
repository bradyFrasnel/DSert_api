import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Employe } from '@prisma/client';

/**
 * Décorateur personnalisé pour extraire l'utilisateur authentifié de la requête
 * Utilisé dans les contrôleurs pour accéder facilement aux informations de l'utilisateur connecté
 *
 * @example
 * async getProfile(@GetUser() user: Employe) {
 *   return user;
 * }
 */
export const GetUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Employe => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
