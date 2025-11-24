import { StatutConvocation, PrioriteConvocation } from '@prisma/client';

export type StatutConvocationType = StatutConvocation;
export type PrioriteConvocationType = PrioriteConvocation;

export interface EmployeBase {
  id: string;
  nom: string;
  prenom: string;
  email: string;
}

export interface ParticipantResponse extends EmployeBase {
  statut: StatutConvocationType;
  date_lecture: Date | null;
  date_mise_a_jour: Date;
  remarque: string | null;
}

export interface PieceJointeResponse {
  id: string;
  nom_fichier: string;
  chemin: string;
  type_mime: string;
  taille: number;
  date_upload: Date;
}

/**
 * Structure complète d'une convocation retournée par l'API.
 */
export interface ConvocationResponse {
  id: string;
  titre: string;
  description: string | null;
  date_creation: Date;
  date_debut: Date;
  date_fin: string | null;

  emetteur: EmployeBase;
  participants: ParticipantResponse[];
  piecesJointes: PieceJointeResponse[];

  // Autres champs que vous pourriez avoir comme lieu, priorite, etc.
  // ...
}

/**
 * Structure de la réponse paginée pour la liste des convocations.
 */
export interface ConvocationListResponse {
  data: ConvocationResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}