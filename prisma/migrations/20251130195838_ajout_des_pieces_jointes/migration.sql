/*
  Warnings:

  - You are about to drop the column `convocationId` on the `pieces_jointes` table. All the data in the column will be lost.
  - You are about to alter the column `nom_fichier` on the `pieces_jointes` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `chemin` on the `pieces_jointes` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `type_mime` on the `pieces_jointes` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - Added the required column `convocation_id` to the `pieces_jointes` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "pieces_jointes" DROP CONSTRAINT "pieces_jointes_convocationId_fkey";

-- AlterTable
ALTER TABLE "pieces_jointes" DROP COLUMN "convocationId",
ADD COLUMN     "convocation_id" TEXT NOT NULL,
ALTER COLUMN "nom_fichier" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "chemin" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "type_mime" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "taille" SET DEFAULT 0,
ALTER COLUMN "date_upload" SET DATA TYPE TIMESTAMPTZ(6);

-- CreateIndex
CREATE INDEX "pieces_jointes_convocation_id_idx" ON "pieces_jointes"("convocation_id");

-- AddForeignKey
ALTER TABLE "pieces_jointes" ADD CONSTRAINT "pieces_jointes_convocation_id_fkey" FOREIGN KEY ("convocation_id") REFERENCES "convocations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
