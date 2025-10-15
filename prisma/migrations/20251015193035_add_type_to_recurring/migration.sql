/*
  Warnings:

  - Added the required column `type` to the `RecurringTransaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "RecurringTransaction" ADD COLUMN     "type" "TransactionType" NOT NULL;
