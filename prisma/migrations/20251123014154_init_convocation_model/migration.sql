
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'manager', 'employe');

-- CreateEnum
CREATE TYPE "StatutConvocationType" AS ENUM ('envoye', 'lu', 'accepte', 'refuse', 'annule');

-- CreateEnum
CREATE TYPE "PrioriteConvocation" AS ENUM ('basse', 'normale', 'haute', 'urgente');

-- DropForeignKey
ALTER TABLE "Convocation" DROP CONSTRAINT "Convocation_conversationId_fkey";

-- DropForeignKey
ALTER TABLE "Convocation" DROP CONSTRAINT "Convocation_emetteurId_fkey";

-- DropForeignKey
ALTER TABLE "Employe" DROP CONSTRAINT "Employe_departementId_fkey";

-- DropForeignKey
ALTER TABLE "MembreConversation" DROP CONSTRAINT "MembreConversation_conversationId_fkey";

-- DropForeignKey
ALTER TABLE "MembreConversation" DROP CONSTRAINT "MembreConversation_employeId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_conversationId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_emetteurId_fkey";

-- DropForeignKey
ALTER TABLE "StatutConvocation" DROP CONSTRAINT "StatutConvocation_convocationId_fkey";

-- DropForeignKey
ALTER TABLE "StatutConvocation" DROP CONSTRAINT "StatutConvocation_employeId_fkey";

-- DropTable
DROP TABLE "Conversation";

-- DropTable
DROP TABLE "Convocation";

-- DropTable
DROP TABLE "Departement";

-- DropTable
DROP TABLE "Employe";

-- DropTable
DROP TABLE "MembreConversation";

-- DropTable
DROP TABLE "Message";

-- DropTable
DROP TABLE "StatutConvocation";

-- CreateTable
CREATE TABLE "departements" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    -- "description" TEXT,
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "departements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employes" (
    "id" TEXT NOT NULL,
    "nom_famille" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "mot_de_passe" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'employe',
    "date_embauche" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_sortie" TIMESTAMP(3),
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "departementId" INTEGER NOT NULL,

    CONSTRAINT "employes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "convocations" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    -- "description" TEXT,
    "date_convocation" TIMESTAMP(3) NOT NULL,
    "heure_debut" TEXT,
    "heure_fin" TEXT,
    "lieu" TEXT NOT NULL,
    -- "priorite" "PrioriteConvocation" NOT NULL DEFAULT 'normale',
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_mise_a_jour" TIMESTAMP(3) NOT NULL,
    "est_annulee" BOOLEAN NOT NULL DEFAULT false,
    "emetteurId" TEXT NOT NULL,
    "conversationId" TEXT,

    CONSTRAINT "convocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "statuts_convocation" (
    "convocationId" TEXT NOT NULL,
    "employeId" TEXT NOT NULL,
    "statut" "StatutConvocationType" NOT NULL DEFAULT 'envoye',
    "date_mise_a_jour" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "remarques" TEXT,
    "date_lecture" TIMESTAMP(3),

    CONSTRAINT "statuts_convocation_pkey" PRIMARY KEY ("convocationId","employeId")
);

-- CreateTable
CREATE TABLE "pieces_jointes" (
    "id" TEXT NOT NULL,
    "nom_fichier" TEXT NOT NULL,
    "chemin" TEXT NOT NULL,
    "type_mime" TEXT NOT NULL,
    "taille" INTEGER NOT NULL,
    "date_upload" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "convocationId" TEXT NOT NULL,

    CONSTRAINT "pieces_jointes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "nom_conversation" TEXT NOT NULL,
    -- "description" TEXT,
    "type_conversation" TEXT NOT NULL,
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "est_active" BOOLEAN NOT NULL DEFAULT true,
    "createurId" TEXT NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membres_conversation" (
    "id" TEXT NOT NULL,
    "date_ajout" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_sortie" TIMESTAMP(3),
    "est_admin" BOOLEAN NOT NULL DEFAULT false,
    "conversationId" TEXT NOT NULL,
    "employeId" TEXT NOT NULL,

    CONSTRAINT "membres_conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "date_envoi" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "est_modifie" BOOLEAN NOT NULL DEFAULT false,
    "date_modification" TIMESTAMP(3),
    "conversationId" TEXT NOT NULL,
    "auteurId" TEXT NOT NULL,
    "est_supprime" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "departements_nom_key" ON "departements"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "employes_email_key" ON "employes"("email");

-- CreateIndex
CREATE INDEX "employes_email_idx" ON "employes"("email");

-- CreateIndex
CREATE INDEX "employes_departementId_idx" ON "employes"("departementId");

-- CreateIndex
CREATE UNIQUE INDEX "convocations_conversationId_key" ON "convocations"("conversationId");

-- CreateIndex
CREATE INDEX "convocations_emetteurId_idx" ON "convocations"("emetteurId");

-- CreateIndex
CREATE INDEX "convocations_date_convocation_idx" ON "convocations"("date_convocation");

-- CreateIndex
CREATE INDEX "statuts_convocation_statut_idx" ON "statuts_convocation"("statut");

-- CreateIndex
CREATE INDEX "statuts_convocation_date_mise_a_jour_idx" ON "statuts_convocation"("date_mise_a_jour");

-- CreateIndex
CREATE INDEX "conversations_createurId_idx" ON "conversations"("createurId");

-- CreateIndex
CREATE INDEX "conversations_type_conversation_idx" ON "conversations"("type_conversation");

-- CreateIndex
CREATE UNIQUE INDEX "membres_conversation_conversationId_employeId_key" ON "membres_conversation"("conversationId", "employeId");

-- CreateIndex
CREATE INDEX "messages_conversationId_idx" ON "messages"("conversationId");

-- CreateIndex
CREATE INDEX "messages_auteurId_idx" ON "messages"("auteurId");

-- CreateIndex
CREATE INDEX "messages_date_envoi_idx" ON "messages"("date_envoi");

-- AddForeignKey
ALTER TABLE "employes" ADD CONSTRAINT "employes_departementId_fkey" FOREIGN KEY ("departementId") REFERENCES "departements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "convocations" ADD CONSTRAINT "convocations_emetteurId_fkey" FOREIGN KEY ("emetteurId") REFERENCES "employes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "convocations" ADD CONSTRAINT "convocations_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "statuts_convocation" ADD CONSTRAINT "statuts_convocation_convocationId_fkey" FOREIGN KEY ("convocationId") REFERENCES "convocations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "statuts_convocation" ADD CONSTRAINT "statuts_convocation_employeId_fkey" FOREIGN KEY ("employeId") REFERENCES "employes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pieces_jointes" ADD CONSTRAINT "pieces_jointes_convocationId_fkey" FOREIGN KEY ("convocationId") REFERENCES "convocations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_createurId_fkey" FOREIGN KEY ("createurId") REFERENCES "employes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membres_conversation" ADD CONSTRAINT "membres_conversation_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membres_conversation" ADD CONSTRAINT "membres_conversation_employeId_fkey" FOREIGN KEY ("employeId") REFERENCES "employes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "employes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
