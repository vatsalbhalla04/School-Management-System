/*
  Warnings:

  - A unique constraint covering the columns `[standardId,SecName]` on the table `Section` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE INDEX "Section_standardId_idx" ON "Section"("standardId");

-- CreateIndex
CREATE INDEX "Section_classTeacherId_idx" ON "Section"("classTeacherId");

-- CreateIndex
CREATE UNIQUE INDEX "Section_standardId_SecName_key" ON "Section"("standardId", "SecName");

-- CreateIndex
CREATE INDEX "Student_sectionId_idx" ON "Student"("sectionId");

-- CreateIndex
CREATE INDEX "Subject_standardId_idx" ON "Subject"("standardId");

-- CreateIndex
CREATE INDEX "Subject_teacherId_idx" ON "Subject"("teacherId");

-- CreateIndex
CREATE INDEX "SubjectAssignment_sectionId_idx" ON "SubjectAssignment"("sectionId");

-- CreateIndex
CREATE INDEX "SubjectAssignment_teacherId_idx" ON "SubjectAssignment"("teacherId");

-- CreateIndex
CREATE INDEX "SubjectAssignment_subjectId_idx" ON "SubjectAssignment"("subjectId");
