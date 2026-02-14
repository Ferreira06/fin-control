/*
  Warnings:

  - The primary key for the `_GoalToTransaction` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `_TagToTransaction` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[A,B]` on the table `_GoalToTransaction` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[A,B]` on the table `_TagToTransaction` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "_GoalToTransaction" DROP CONSTRAINT "_GoalToTransaction_AB_pkey";

-- AlterTable
ALTER TABLE "_TagToTransaction" DROP CONSTRAINT "_TagToTransaction_AB_pkey";

-- CreateIndex
CREATE UNIQUE INDEX "_GoalToTransaction_AB_unique" ON "_GoalToTransaction"("A", "B");

-- CreateIndex
CREATE UNIQUE INDEX "_TagToTransaction_AB_unique" ON "_TagToTransaction"("A", "B");
