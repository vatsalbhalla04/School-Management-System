-- DropForeignKey
ALTER TABLE "public"."Student" DROP CONSTRAINT "Student_sectionId_fkey";

-- AlterTable
ALTER TABLE "public"."Student" ALTER COLUMN "sectionId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Student" ADD CONSTRAINT "Student_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "public"."Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;
