/*
  Warnings:

  - You are about to alter the column `idvk` on the `Account` table. The data in that column could be lost. The data in that column will be cast from `Int` to `BigInt`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Account" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "idvk" BIGINT NOT NULL,
    "id_role" INTEGER NOT NULL DEFAULT 1,
    "censored" BOOLEAN NOT NULL DEFAULT true,
    "banned" BOOLEAN NOT NULL DEFAULT false,
    "donate" BOOLEAN NOT NULL DEFAULT false,
    "crdate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "online" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Account" ("banned", "censored", "crdate", "donate", "id", "id_role", "idvk", "online") SELECT "banned", "censored", "crdate", "donate", "id", "id_role", "idvk", "online" FROM "Account";
DROP TABLE "Account";
ALTER TABLE "new_Account" RENAME TO "Account";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
