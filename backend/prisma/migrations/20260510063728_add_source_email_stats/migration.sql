-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_RegistrationSource" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "senderEmail" TEXT,
    "category" TEXT NOT NULL,
    "confidence" TEXT NOT NULL,
    "frequency" TEXT,
    "emailCount" INTEGER NOT NULL DEFAULT 0,
    "firstEmailAt" DATETIME,
    "lastEmailAt" DATETIME,
    "isUrgent" BOOLEAN NOT NULL DEFAULT false,
    "gmailQuery" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RegistrationSource_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_RegistrationSource" ("accountId", "category", "confidence", "createdAt", "domain", "frequency", "gmailQuery", "id", "isUrgent", "lastEmailAt", "name", "senderEmail", "updatedAt") SELECT "accountId", "category", "confidence", "createdAt", "domain", "frequency", "gmailQuery", "id", "isUrgent", "lastEmailAt", "name", "senderEmail", "updatedAt" FROM "RegistrationSource";
DROP TABLE "RegistrationSource";
ALTER TABLE "new_RegistrationSource" RENAME TO "RegistrationSource";
CREATE INDEX "RegistrationSource_accountId_idx" ON "RegistrationSource"("accountId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
