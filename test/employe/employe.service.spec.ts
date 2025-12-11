import { Test, TestingModule } from '@nestjs/testing';
import { EmployeService } from '../../src/employe/employe.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('EmployeService', () => {
  let service: EmployeService;
  let prisma: PrismaService;

  // Données de test
  const mockEmployees = [
    {
      id: '1',
      nomFamille: 'Doe',
      prenom: 'John',
      email: 'john.doe@example.com',
      role: Role.EMPLOYE,
      actif: true,
      dateEmbauche: new Date(),
      departementId: 1,
      departement: {
        id: 1,
        nom: 'Ressources Humaines',
        description: 'Département des ressources humaines'
      }
    },
    {
      id: '2',
      nomFamille: 'Smith',
      prenom: 'Jane',
      email: 'jane.smith@example.com',
      role: Role.MANAGER,
      actif: true,
      dateEmbauche: new Date(),
      departementId: 2,
      departement: {
        id: 2,
        nom: 'Informatique',
        description: 'Département informatique'
      }
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeService,
        {
          provide: PrismaService,
          useValue: {
            employe: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              count: jest.fn(),
            },
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(10), // Pour SALT_ROUNDS
          },
        },
      ],
    }).compile();

    service = module.get<EmployeService>(EmployeService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('devrait être défini', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('devrait retourner une liste paginée de tous les employés', async () => {
      // Configuration du mock pour prisma.employe.findMany
      (prisma.employe.findMany as jest.Mock).mockResolvedValue(mockEmployees);
      
      // Configuration du mock pour le comptage total
      (prisma.employe.count as jest.Mock).mockResolvedValue(mockEmployees.length);

      const result = await service.findAll(0, 10);

      // Vérifications
      expect(prisma.employe.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        include: { departement: true },
        orderBy: { dateEmbauche: 'desc' },
      });
      
      expect(prisma.employe.count).toHaveBeenCalled();
      
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

    it('devrait retourner une liste vide si aucun employé trouvé', async () => {
      // Configuration du mock pour retourner une liste vide
      (prisma.employe.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.employe.count as jest.Mock).mockResolvedValue(0);

      const result = await service.findAll(0, 10);

      expect(result).toEqual({
        data: [],
        total: 0,
      });
    });

    it('devrait gérer correctement la pagination', async () => {
      // Configuration du mock pour la pagination
      (prisma.employe.findMany as jest.Mock).mockResolvedValue([mockEmployees[0]]);
      (prisma.employe.count as jest.Mock).mockResolvedValue(mockEmployees.length);

      const result = await service.findAll(0, 1);

      expect(prisma.employe.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 1,
        include: { departement: true },
        orderBy: { dateEmbauche: 'desc' },
      });
      
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(mockEmployees.length);
    });
  });
});
