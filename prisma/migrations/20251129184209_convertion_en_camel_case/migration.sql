/*
  Warnings:

  - You are about to drop the column `createurId` on the `conversations` table. All the data in the column will be lost.
  - Added the required column `createur_id` to the `conversations` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "conversations" DROP CONSTRAINT "conversations_createurId_fkey";

-- DropIndex
DROP INDEX "conversations_createurId_idx";

-- AlterTable
ALTER TABLE "conversations" DROP COLUMN "createurId",
ADD COLUMN     "createur_id" TEXT NOT NULL,
ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "convocations" ADD COLUMN     "description" TEXT,
ADD COLUMN     "priorite" "PrioriteConvocation" NOT NULL DEFAULT 'normale';

-- AlterTable
ALTER TABLE "departements" ADD COLUMN     "description" TEXT;

-- CreateIndex
CREATE INDEX "conversations_createur_id_idx" ON "conversations"("createur_id");

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_createur_id_fkey" FOREIGN KEY ("createur_id") REFERENCES "employes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
