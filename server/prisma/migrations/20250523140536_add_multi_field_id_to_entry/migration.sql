/*
  Warnings:

  - The primary key for the `Entry` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Entry` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,date]` on the table `Entry` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Entry" DROP CONSTRAINT "Entry_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "Entry_pkey" PRIMARY KEY ("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Entry_userId_date_key" ON "Entry"("userId", "date");
