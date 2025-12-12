-- CreateEnum
CREATE TYPE "PersonType" AS ENUM ('FISICA', 'JURIDICA');
CREATE TYPE "SaleStatus" AS ENUM ('EM_ANDAMENTO', 'APROVADO', 'FATURADO', 'CANCELADO');
CREATE TYPE "InstallmentStatus" AS ENUM ('OPEN', 'OVERDUE', 'PAID');

-- CreateTable
CREATE TABLE "Token" (
    "id" TEXT PRIMARY KEY,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Customer" (
    "id" TEXT PRIMARY KEY,
    "legacyId" TEXT,
    "name" TEXT NOT NULL,
    "document" TEXT,
    "personType" "PersonType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "Customer_legacyId_key" ON "Customer"("legacyId");

CREATE TABLE "Sale" (
    "id" TEXT PRIMARY KEY,
    "legacyId" TEXT,
    "number" TEXT NOT NULL,
    "status" "SaleStatus" NOT NULL,
    "totalValue" DECIMAL(18,2) NOT NULL,
    "customerId" TEXT NOT NULL REFERENCES "Customer"("id") ON DELETE CASCADE,
    "saleDate" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "PaymentInstallment" (
    "id" TEXT PRIMARY KEY,
    "saleId" TEXT NOT NULL REFERENCES "Sale"("id") ON DELETE CASCADE,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "status" "InstallmentStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "PollState" (
    "id" INTEGER PRIMARY KEY,
    "lastPolledAt" TIMESTAMP(3) NOT NULL
);
