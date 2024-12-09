/*
  Warnings:

  - You are about to alter the column `idvk` on the `BlackList` table. The data in that column could be lost. The data in that column will be cast from `Int` to `BigInt`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BlackList" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "idvk" BIGINT NOT NULL,
    "id_account" INTEGER NOT NULL,
    CONSTRAINT "BlackList_id_account_fkey" FOREIGN KEY ("id_account") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_BlackList" ("id", "id_account", "idvk") SELECT "id", "id_account", "idvk" FROM "BlackList";
DROP TABLE "BlackList";
ALTER TABLE "new_BlackList" RENAME TO "BlackList";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
