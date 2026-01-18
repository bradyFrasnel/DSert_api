import { Test, TestingModule } from '@nestjs/testing';
import { EmployeController } from '../../src/employe/employe.controller';
import { EmployeService } from '../../src/employe/employe.service';
import { JwtAuthGuard } from '../../src/auth/jwt-auth.guard';
import { RolesGuard } from '../../src/auth/roles.guard';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';

// Mock du service EmployeService
const mockEmployeService = {
  findAll: jest.fn(),
  findByDepartment: jest.fn(),
};

// Mock du garde d'authentification
const mockJwtAuthGuard = {
  canActivate: (context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    request.user = { id: '1', role: Role.ADMIN, departementId: 1 };
    return true;
  },
};

// Mock pour le décorateur @Roles
const mockRolesGuard = {
  canActivate: (context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    // Simuler la logique de base des rôles pour le test
    return [Role.ADMIN, Role.MANAGER].includes(user?.role);
  },
};

describe('EmployeController', () => {
  let controller: EmployeController;
  let service: EmployeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmployeController],
      providers: [
        {
          provide: EmployeService,
          useValue: mockEmployeService,
        },
        {
          provide: Reflector,
          useValue: {
            get: jest.fn().mockImplementation((key) => {
              if (key === 'roles') return [Role.ADMIN, Role.MANAGER];
              return undefined;
            }),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .compile();

    controller = module.get<EmployeController>(EmployeController);
    service = module.get<EmployeService>(EmployeService);
  });

  it('devrait être défini', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('devrait retourner une liste paginée de tous les employés pour un admin', async () => {
      const mockEmployees = [
        {
          id: '1',
          nomFamille: 'Doe',
          prenom: 'John',
          email: 'john.doe@example.com',
          role: Role.EMPLOYE,
          departementId: 1,
          departement: {
            id: 1,
            nom: 'Ressources Humaines',
          },
        },
        {
          id: '2',
          nomFamille: 'Smith',
          prenom: 'Jane',
          email: 'jane.smith@example.com',
          role: Role.MANAGER,
          departementId: 2,
          departement: {
            id: 2,
            nom: 'Informatique',
          },
        },
      ];

      // Configuration du mock pour un admin
      (service.findAll as jest.Mock).mockResolvedValue({
        data: mockEmployees,
        total: mockEmployees.length,
      });

      const result = await controller.findAll('1', '10', {
        id: '1',
        role: Role.ADMIN,
        departementId: 1,
      } as any);

      // Vérifications
      expect(service.findAll).toHaveBeenCalledWith(0, 10);
      expect(result).toEqual({
        data: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            nomFamille: expect.any(String),
            prenom: expect.any(String),
            email: expect.any(String),
            departement: expect.any(Object),
          }),
        ]),
        total: mockEmployees.length,
      });
    });

    it('devrait retourner uniquement les employés du département pour un manager', async () => {
      const departmentEmployees = [
        {
          id: '3',
          nomFamille: 'Dupont',
          prenom: 'Pierre',
          email: 'pierre.dupont@example.com',
          role: Role.EMPLOYE,
          departementId: 1,
          departement: {
            id: 1,
            nom: 'Ressources Humaines',
          },
        },
      ];

      // Configuration du mock pour un manager
      (service.findByDepartment as jest.Mock).mockResolvedValue(
        departmentEmployees,
      );

      const result = await controller.findAll('1', '10', {
        id: '2',
        role: Role.MANAGER,
        departementId: 1, // Même département que les employés
      } as any);

      // Vérifications
      expect(service.findByDepartment).toHaveBeenCalledWith(1);
      expect(result).toEqual({
        data: expect.arrayContaining([
          expect.objectContaining({
            id: '3',
            nomFamille: 'Dupont',
            prenom: 'Pierre',
            departementId: 1,
          }),
        ]),
        total: departmentEmployees.length,
        page: 1,
        limit: departmentEmployees.length,
      });
    });

    it('devrait gérer la pagination correctement', async () => {
      const mockEmployees = Array(15)
        .fill(0)
        .map((_, i) => ({
          id: String(i + 1),
          nomFamille: `User${i + 1}`,
          prenom: 'Test',
          email: `user${i + 1}@example.com`,
          role: Role.EMPLOYE,
          departementId: 1,
          departement: {
            id: 1,
            nom: 'Ressources Humaines',
          },
        }));

      // Configuration du mock pour la pagination
      (service.findAll as jest.Mock).mockImplementation((skip, take) => {
        return Promise.resolve({
          data: mockEmployees.slice(skip, skip + take),
          total: mockEmployees.length,
        });
      });

      const page = '2';
      const limit = '5';
      const result = await controller.findAll(page, limit, {
        id: '1',
        role: Role.ADMIN,
        departementId: 1,
      } as any);

      // Vérifications
      expect(service.findAll).toHaveBeenCalledWith(5, 5); // (page-1)*limit, limit
      expect(result.data).toHaveLength(5);
      expect(result.total).toBe(mockEmployees.length);
    });
  });
});
