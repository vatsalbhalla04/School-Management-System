-- CreateIndex
CREATE INDEX "Student_studentId_sectionId_idx" ON "public"."Student"("studentId", "sectionId");

-- CreateIndex
CREATE INDEX "Subject_standardId_teacherId_idx" ON "public"."Subject"("standardId", "teacherId");

-- CreateIndex
CREATE INDEX "Teacher_teacherId_idx" ON "public"."Teacher"("teacherId");

-- CreateIndex
CREATE INDEX "User_id_role_idx" ON "public"."User"("id", "role");
