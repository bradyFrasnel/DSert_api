import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { EmployeService } from '../../employe/employe.service';
import { CreateConvocationDto } from '../dto/create-convocation.dto';
import { Role } from '@prisma/client';

/**
 * Ce Guard vérifie si un Manager est autorisé à créer une convocation pour un employé spécifique.
 * Règles:
 * 1. Si l'utilisateur est Admin, l'accès est accordé.
 * 2. Si l'utilisateur est Manager, l'employé convoqué DOIT être dans le même département que le Manager.
 */
@Injectable()
export class ManagerConvocationGuard implements CanActivate {
  constructor(private employeService: EmployeService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    // Le payload JWT a été injecté par JwtAuthGuard
    const managerPayload = request.user;
    if (!managerPayload) {
      throw new ForbiddenException('Utilisateur non authentifié');
    }

    // Le DTO de création est dans le corps de la requête (Body)
    const createDto: CreateConvocationDto = request.body;
    if (!createDto) {
      throw new ForbiddenException('Données de convocation manquantes');
    }

    // L'ID de l'employé convoqué est obligatoire pour la création
    const employeConvoqueId = createDto?.employeConvoqueId;

    // 1. Les Administrateurs ont toujours le droit de passer
    if (managerPayload.role === Role.ADMIN) {
      return true;
    }

    // Si ce n'est pas un Manager, le RolesGuard aurait déjà bloqué l'accès (403 Forbidden).
    // Nous pouvons donc assumer que c'est un Manager ici.
    if (managerPayload.role !== Role.MANAGER) {
      // Ce cas ne devrait théoriquement pas être atteint si RolesGuard est utilisé correctement
      return false;
    }

    // Si l'employé convoqué n'est pas fourni (validation DTO), nous laissons passer
    // pour que la ValidationPipe ou le service gère l'erreur 400.
    if (!employeConvoqueId) {
      return true;
    }

    // 2. Récupérer les informations complètes du Manager connecté
    // Nous avons besoin de son ID de département
    if (!managerPayload.employeId) {
      throw new ForbiddenException('ID employé manquant dans le token');
    }

    const manager = await this.employeService.findOneById(
      managerPayload.employeId,
    );

    if (!manager) {
      throw new ForbiddenException('Manager non trouvé');
    }

    if (!manager.departementId) {
      throw new ForbiddenException(
        "Le manager n'est associé à aucun département et ne peut pas créer de convocation.",
      );
    }

    // 3. Récupérer les informations de l'Employé convoqué
    const employeConvoque =
      await this.employeService.findOneById(employeConvoqueId);

    if (!employeConvoque) {
      // L'employé convoqué n'existe pas. Le service gérera l'erreur 404, le guard autorise temporairement.
      return true;
    }

    // 4. Comparaison des ID de département
    if (manager.departementId !== employeConvoque.departementId) {
      throw new ForbiddenException(
        'Un manager ne peut créer des convocations que pour les employés de son propre département.',
      );
    }

    // Si les départements correspondent, le Manager a le droit de convoquer.
    return true;
  }
}
