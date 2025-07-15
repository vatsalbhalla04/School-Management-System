/*
  Warnings:

  - You are about to drop the `_SectionSubjectTeachers` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `standardId` to the `Subject` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "_SectionSubjectTeachers" DROP CONSTRAINT "_SectionSubjectTeachers_A_fkey";

-- DropForeignKey
ALTER TABLE "_SectionSubjectTeachers" DROP CONSTRAINT "_SectionSubjectTeachers_B_fkey";

-- AlterTable
ALTER TABLE "Subject" ADD COLUMN     "standardId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "_SectionSubjectTeachers";

-- CreateTable
CREATE TABLE "SubjectAssignment" (
    "id" SERIAL NOT NULL,
    "teacherId" TEXT NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "sectionId" INTEGER NOT NULL,

    CONSTRAINT "SubjectAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SubjectAssignment_teacherId_subjectId_sectionId_key" ON "SubjectAssignment"("teacherId", "subjectId", "sectionId");

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_standardId_fkey" FOREIGN KEY ("standardId") REFERENCES "Standard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectAssignment" ADD CONSTRAINT "SubjectAssignment_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectAssignment" ADD CONSTRAINT "SubjectAssignment_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectAssignment" ADD CONSTRAINT "SubjectAssignment_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
