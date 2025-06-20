/*
  Warnings:

  - Added the required column `hour` to the `occurrences` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "clients" DROP CONSTRAINT "clients_casino_id_fkey";

-- DropForeignKey
ALTER TABLE "interdictions" DROP CONSTRAINT "interdictions_casino_id_fkey";

-- DropForeignKey
ALTER TABLE "interdictions" DROP CONSTRAINT "interdictions_client_id_fkey";

-- DropForeignKey
ALTER TABLE "occurrences" DROP CONSTRAINT "occurrences_casino_id_fkey";

-- DropForeignKey
ALTER TABLE "occurrences" DROP CONSTRAINT "occurrences_client_id_fkey";

-- DropForeignKey
ALTER TABLE "special_taxes" DROP CONSTRAINT "special_taxes_casino_id_fkey";

-- DropForeignKey
ALTER TABLE "stamp_taxes" DROP CONSTRAINT "stamp_taxes_casino_id_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_casino_id_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_client_id_fkey";

-- AlterTable
ALTER TABLE "occurrences" ADD COLUMN     "hour" TIME NOT NULL,
ALTER COLUMN "date" SET DATA TYPE DATE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_casino_id_fkey" FOREIGN KEY ("casino_id") REFERENCES "casinos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interdictions" ADD CONSTRAINT "interdictions_casino_id_fkey" FOREIGN KEY ("casino_id") REFERENCES "casinos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interdictions" ADD CONSTRAINT "interdictions_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_casino_id_fkey" FOREIGN KEY ("casino_id") REFERENCES "casinos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "occurrences" ADD CONSTRAINT "occurrences_casino_id_fkey" FOREIGN KEY ("casino_id") REFERENCES "casinos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "occurrences" ADD CONSTRAINT "occurrences_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "special_taxes" ADD CONSTRAINT "special_taxes_casino_id_fkey" FOREIGN KEY ("casino_id") REFERENCES "casinos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stamp_taxes" ADD CONSTRAINT "stamp_taxes_casino_id_fkey" FOREIGN KEY ("casino_id") REFERENCES "casinos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
