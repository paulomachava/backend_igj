-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'gestor', 'tecnico');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('activo', 'inactivo');

-- CreateEnum
CREATE TYPE "AttachmentType" AS ENUM ('PDF', 'Document', 'Image');

-- CreateEnum
CREATE TYPE "CasinoLocation" AS ENUM ('Maputo', 'Matola', 'Inhambane', 'Gaza', 'Beira', 'Manica', 'Zambezia', 'Tete', 'Nampula', 'Niassa', 'Pemba');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('cash', 'bank');

-- CreateEnum
CREATE TYPE "OccurrenceStatus" AS ENUM ('pendente', 'resolvido', 'em_analise');

-- CreateEnum
CREATE TYPE "ClientIDType" AS ENUM ('BI', 'Dir', 'passporte', 'Carta de condução');

-- CreateEnum
CREATE TYPE "InterdictionType" AS ENUM ('voluntaria', 'judicial', 'administrativa');

-- CreateEnum
CREATE TYPE "InterdictionStatus" AS ENUM ('pendente', 'aprovada', 'rejeitada');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'activo',
    "role" "UserRole" NOT NULL,
    "last_login" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "created_by" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "casinos" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact" TEXT,
    "email" TEXT,
    "location" "CasinoLocation" NOT NULL,
    "adress" TEXT NOT NULL,
    "founded_in" TIMESTAMP(3) NOT NULL,
    "license_nr" TEXT NOT NULL,
    "license_validity" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "user_id" TEXT NOT NULL,

    CONSTRAINT "casinos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "id_type" "ClientIDType" NOT NULL DEFAULT 'BI',
    "id_number" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "casino_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "user_id" TEXT NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interdictions" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "casino_id" TEXT NOT NULL,
    "type" "InterdictionType" NOT NULL,
    "reason" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "InterdictionStatus" NOT NULL DEFAULT 'pendente',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "user_id" TEXT NOT NULL,

    CONSTRAINT "interdictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "casino_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" "TransactionType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "user_id" TEXT NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "occurrences" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "casino_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "OccurrenceStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "user_id" TEXT NOT NULL,

    CONSTRAINT "occurrences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientAttachment" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "type" "AttachmentType" NOT NULL,
    "url" TEXT NOT NULL,
    "client_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "ClientAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interdictions_attachments" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "type" "AttachmentType" NOT NULL,
    "url" TEXT NOT NULL,
    "interdiction_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "interdictions_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "occurrences_attachments" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "type" "AttachmentType" NOT NULL,
    "url" TEXT NOT NULL,
    "occurrence_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "occurrences_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "special_taxes" (
    "id" TEXT NOT NULL,
    "casino_id" TEXT NOT NULL,
    "table_result" DOUBLE PRECISION NOT NULL,
    "machine_result" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "user_id" TEXT NOT NULL,

    CONSTRAINT "special_taxes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stamp_taxes" (
    "id" TEXT NOT NULL,
    "casino_id" TEXT NOT NULL,
    "tickets_sold" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "user_id" TEXT NOT NULL,

    CONSTRAINT "stamp_taxes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "clients_id_number_key" ON "clients"("id_number");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "casinos" ADD CONSTRAINT "casinos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_casino_id_fkey" FOREIGN KEY ("casino_id") REFERENCES "casinos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interdictions" ADD CONSTRAINT "interdictions_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interdictions" ADD CONSTRAINT "interdictions_casino_id_fkey" FOREIGN KEY ("casino_id") REFERENCES "casinos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interdictions" ADD CONSTRAINT "interdictions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_casino_id_fkey" FOREIGN KEY ("casino_id") REFERENCES "casinos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "occurrences" ADD CONSTRAINT "occurrences_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "occurrences" ADD CONSTRAINT "occurrences_casino_id_fkey" FOREIGN KEY ("casino_id") REFERENCES "casinos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "occurrences" ADD CONSTRAINT "occurrences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientAttachment" ADD CONSTRAINT "ClientAttachment_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interdictions_attachments" ADD CONSTRAINT "interdictions_attachments_interdiction_id_fkey" FOREIGN KEY ("interdiction_id") REFERENCES "interdictions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "occurrences_attachments" ADD CONSTRAINT "occurrences_attachments_occurrence_id_fkey" FOREIGN KEY ("occurrence_id") REFERENCES "occurrences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "special_taxes" ADD CONSTRAINT "special_taxes_casino_id_fkey" FOREIGN KEY ("casino_id") REFERENCES "casinos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "special_taxes" ADD CONSTRAINT "special_taxes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stamp_taxes" ADD CONSTRAINT "stamp_taxes_casino_id_fkey" FOREIGN KEY ("casino_id") REFERENCES "casinos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stamp_taxes" ADD CONSTRAINT "stamp_taxes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
