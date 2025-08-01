/*
  Warnings:

  - The `emergencyPhone` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[emergencyPhone]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "emergencyPhone",
ADD COLUMN     "emergencyPhone" BIGINT;

-- CreateIndex
CREATE UNIQUE INDEX "User_emergencyPhone_key" ON "User"("emergencyPhone");
