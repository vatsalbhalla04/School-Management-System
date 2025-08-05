/*
  Warnings:

  - A unique constraint covering the columns `[studentId,sectionId]` on the table `Student` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Student_studentId_sectionId_key" ON "public"."Student"("studentId", "sectionId");
