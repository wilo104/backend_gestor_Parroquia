/*
  Warnings:

  - Made the column `descripcion` on table `Egreso` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Egreso" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "fecha" DROP DEFAULT,
ALTER COLUMN "descripcion" SET NOT NULL;
