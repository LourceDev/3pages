/*
  Warnings:

  - Added the required column `word_count` to the `Entry` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Entry" (
    "user_id" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "text" JSONB NOT NULL,
    "word_count" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("user_id", "date"),
    CONSTRAINT "Entry_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Entry" ("created_at", "date", "text", "user_id") SELECT "created_at", "date", "text", "user_id" FROM "Entry";
DROP TABLE "Entry";
ALTER TABLE "new_Entry" RENAME TO "Entry";
CREATE UNIQUE INDEX "Entry_user_id_date_key" ON "Entry"("user_id", "date");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
