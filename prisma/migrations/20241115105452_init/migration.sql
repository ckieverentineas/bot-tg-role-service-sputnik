-- CreateTable
CREATE TABLE "Account" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "idvk" INTEGER NOT NULL,
    "id_role" INTEGER NOT NULL DEFAULT 1,
    "censored" BOOLEAN NOT NULL DEFAULT true,
    "banned" BOOLEAN NOT NULL DEFAULT false,
    "donate" BOOLEAN NOT NULL DEFAULT false,
    "crdate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "online" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "BlackList" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "idvk" INTEGER NOT NULL,
    "id_account" INTEGER NOT NULL,
    CONSTRAINT "BlackList_id_account_fkey" FOREIGN KEY ("id_account") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Blank" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "text" TEXT NOT NULL,
    "photo" TEXT NOT NULL DEFAULT '',
    "id_account" INTEGER NOT NULL,
    "banned" BOOLEAN NOT NULL DEFAULT false,
    "crdate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Blank_id_account_fkey" FOREIGN KEY ("id_account") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Vision" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_account" INTEGER NOT NULL,
    "id_blank" INTEGER NOT NULL,
    CONSTRAINT "Vision_id_account_fkey" FOREIGN KEY ("id_account") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Vision_id_blank_fkey" FOREIGN KEY ("id_blank") REFERENCES "Blank" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Mail" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "blank_to" INTEGER NOT NULL,
    "blank_from" INTEGER NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "status" BOOLEAN NOT NULL DEFAULT false,
    "find" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "Report" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "text" TEXT NOT NULL,
    "id_blank" INTEGER NOT NULL,
    "id_account" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'wait',
    CONSTRAINT "Report_id_blank_fkey" FOREIGN KEY ("id_blank") REFERENCES "Blank" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Report_id_account_fkey" FOREIGN KEY ("id_account") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
