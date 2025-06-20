/*
  Warnings:

  - Added the required column `period` to the `interdictions` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "InterdictionPeriod" AS ENUM ('seis_meses', 'um_ano', 'dois_anos', 'tres_anos', 'cinco_anos', 'indefinido');

-- AlterTable
ALTER TABLE "interdictions" ADD COLUMN     "period" "InterdictionPeriod" NOT NULL;
