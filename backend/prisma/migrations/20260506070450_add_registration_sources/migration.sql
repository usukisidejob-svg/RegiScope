-- CreateTable
CREATE TABLE "RegistrationSource" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "confidence" TEXT NOT NULL,
    "frequency" TEXT,
    "lastEmailAt" DATETIME,
    "isUrgent" BOOLEAN NOT NULL DEFAULT false,
    "gmailQuery" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RegistrationSource_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "RegistrationSource_accountId_idx" ON "RegistrationSource"("accountId");
