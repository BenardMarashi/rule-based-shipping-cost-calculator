-- prisma/migrations/20250429000000_create_carrier_tables/migration.sql

-- CreateTable
CREATE TABLE "Carrier" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "maxWeight" REAL NOT NULL,
    "baseCost" REAL NOT NULL,
    "costPerKg" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CountryRate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "carrierId" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "countryName" TEXT NOT NULL,
    "deliveryTime" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CountryRate_carrierId_fkey" FOREIGN KEY ("carrierId") REFERENCES "Carrier" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WeightRate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "countryRateId" TEXT NOT NULL,
    "minWeight" REAL NOT NULL,
    "maxWeight" REAL NOT NULL,
    "price" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WeightRate_countryRateId_fkey" FOREIGN KEY ("countryRateId") REFERENCES "CountryRate" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "CountryRate_carrierId_idx" ON "CountryRate"("carrierId");

-- CreateIndex
CREATE INDEX "WeightRate_countryRateId_idx" ON "WeightRate"("countryRateId");