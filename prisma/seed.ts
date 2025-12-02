// prisma/seed.ts

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

// 1. Initialisation
const prisma = new PrismaClient();
const SALT_ROUNDS = 10;
const DEFAULT_PASSWORD = 'admin_password_123'; // *** PENSEZ À CHANGER CE MOT DE PASSE ! ***

async function main() {
  console.log('Démarrage du Seeding...');

  // Hachage du mot de passe
  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);

  // 2. Création du Département Initial (ou le trouve s'il existe)
  const direction = await prisma.departement.upsert({
    where: { nom: 'Direction Générale' },
    update: {},
    create: {
      nom: 'Direction Générale',
    },
  });
  console.log(`Département créé/trouvé: ${direction.nom} (ID: ${direction.id})`);

  // 3. Création du Premier Utilisateur Admin (ou metle  à jour s'il existe)
  const adminEmail = 'admin@dsert.com';
  const adminUser = await prisma.employe.upsert({
    where: { email: adminEmail },
    update: { 
        motDePasse: hashedPassword,
        departementId: direction.id,
    },
    create: {
      email: adminEmail,
      motDePasse: hashedPassword,
      nomFamille: 'Système',
      prenom: 'Admin',
      role: 'ADMIN', 
      departementId: direction.id,
      dateEmbauche: new Date(),
    },
  });
  console.log(`Utilisateur Admin créé/mis à jour: ${adminUser.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });