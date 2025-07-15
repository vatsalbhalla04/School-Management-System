/*
  Warnings:

  - A unique constraint covering the columns `[StdName]` on the table `Standard` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
CREATE TABLE "_SectionSubjectTeachers" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SectionSubjectTeachers_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_SectionSubjectTeachers_B_index" ON "_SectionSubjectTeachers"("B");

-- CreateIndex
CREATE UNIQUE INDEX "Standard_StdName_key" ON "Standard"("StdName");

-- AddForeignKey
ALTER TABLE "_SectionSubjectTeachers" ADD CONSTRAINT "_SectionSubjectTeachers_A_fkey" FOREIGN KEY ("A") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SectionSubjectTeachers" ADD CONSTRAINT "_SectionSubjectTeachers_B_fkey" FOREIGN KEY ("B") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;
