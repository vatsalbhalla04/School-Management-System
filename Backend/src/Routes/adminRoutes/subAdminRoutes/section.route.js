import pkg from "@prisma/client";
import { Router } from "express";
import { TryCatch } from "../../../middleware/error.js";
import ErrorHandler from "../../../utils/utility.js";
import sectionValidation from "../../../validators/admin/section.validator.js";

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

const sectionRoute = Router();

sectionRoute.post(
  "/add-section",
  TryCatch(async (req, res, next) => {
    const result = sectionValidation.safeParse(req.body);

    if (!result.success)
      return next(new ErrorHandler("Validation Failed", 404));

    const { SecName, StdName, classTeacherUsername } = result.data;

    // 1st check: check id the std already exits if not then tell the Admin to create the standard then map the section with the std.
    const std = await prisma.standard.findUnique({
      where: { StdName },
    });

    if (!std) return next(new ErrorHandler("Standard Does not Exists", 404));

    // 2nd check: Check if section already exists under this standard
    const existingSection = await prisma.section.findFirst({
      where: {
        SecName,
        standardId: std.id,
      },
    });

    if (existingSection)
      return next(
        new ErrorHandler("Section already exists under this standard", 409)
      );

    // 3rd Check: If class teacher is provided, fetch the teacher:
    // 3rd Check: If class teacher is provided, fetch the teacher:
    let classTeacher = null;

    if (classTeacherUsername) {
      const teacherUser = await prisma.user.findUnique({
        where: { username: classTeacherUsername },
      });

      if (!teacherUser || teacherUser.role !== "TEACHER")
        return next(new ErrorHandler("Class Teacher Username is invalid", 404));

      classTeacher = await prisma.teacher.findUnique({
        where: {
          teacherId: teacherUser.id,
        },
      });

      if (!classTeacher)
        return next(new ErrorHandler("Class teacher profile not found", 404));

      //Only run this if classTeacher exists
      const alreadyAssigned = await prisma.section.findFirst({
        where: {
          classTeacherId: classTeacher.id,
        },
      });

      if (alreadyAssigned)
        return next(
          new ErrorHandler(
            `Faculty ${classTeacherUsername} is already assigned to Section ${std.StdName} ${alreadyAssigned.SecName}`
          )
        );
    }
    // now create the section (maping the std and assigning the classTeacher for that section too)
    const newSection = await prisma.section.create({
      data: {
        SecName,
        standardId: std.id,
        classTeacherId: classTeacher ? classTeacher.id : null,
      },
    });

    res.status(200).json({
      success: true,
      message: `Section ${newSection.SecName} added to Standard ${StdName}${
        classTeacherUsername
          ? ` whose Assigned Class Teacher is ${classTeacherUsername}`
          : ""
      }`,
    });
  })
);

sectionRoute.put(
  "/update-section-details/:id",
  TryCatch(async (req, res, next) => {
    const result = sectionValidation.safeParse(req.body);

    if (!result.success)
      return next(new ErrorHandler("Validations Failed", 404));

    const id = Number(req.params.id);

    const { StdName, SecName, classTeacherUsername } = result.data;

    //find the section Id :
    const section = await prisma.section.findUnique({
      where: { id },
    });

    if (!section) return next(new ErrorHandler("No section found", 404));

    const std = await prisma.standard.findUnique({
      where: { StdName },
    });

    if (!std) return next(new ErrorHandler("No such standard found", 404));

    const existingSection = await prisma.section.findFirst({
      where: {
        SecName,
        standardId: section.id,
        NOT: { id: section.id },
      },
    });

    if (existingSection)
      return next(
        new ErrorHandler(
          "Another section with this name already exists in the same standard.",
          400
        )
      );

    //Optional Teacher update :
    let classTeacher = undefined;
    if (classTeacherUsername) {
      const teacher = await prisma.user.findUnique({
        where: { username: classTeacherUsername },
      });

      if (!teacher || teacher.role !== "TEACHER")
        return next(new ErrorHandler("Class Teacher Not Valid", 404));

      const faculty = await prisma.teacher.findUnique({
        where: {
          teacherId: teacher.id,
        },
      });

      if (!faculty)
        return next(new ErrorHandler("Teacher record not found", 404));

      classTeacher = faculty.id;
    }

    const updateSection = await prisma.section.update({
      where: {
        id,
      },
      data: {
        SecName,
        classTeacher: classTeacher
          ? { connect: { id: classTeacher } }
          : undefined,
        standard: { connect: { id: std.id } },
      },
      include: {
        classTeacher: {
          select: {
            teacher: {
              select: {
                firstname: true,
                lastname: true,
                username: true,
              },
            },
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      Updated_Section_Details: updateSection,
    });
  })
);

sectionRoute.delete(
  "/delete-section/:id",
  TryCatch(async (req, res, next) => {

    const id = Number(req.params.id); 

    // Step 1: Find the standard by name
    const section = await prisma.section.findUnique({
      where: { id },
      include:{
        standard: true, 
        students: true // includes the full User object
        
        //include is also used in read operations, but instead of cherry-picking fields like select, it fetches the full related model(s).
      }
    });

    if(!section) return next(new ErrorHandler(`Section Not Found`,404));

    //prevent delete if students are enrolled:
    if(section.students.length > 0) return next(new ErrorHandler(`Cannot delete section ${section.SecName} of standard ${section.standard.StdName} as it has ${section.students.length} enrolled in it`,404)); 

    const deletedSection = await prisma.section.delete({
      where: { id },
      select:{
        SecName : true, 
        standard : true, 
        classTeacher: {
          select:{
             teacher:{
              select:{
                firstname: true, 
                lastname: true, 
                username: true
              }
             }
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      message: `Section ${section.SecName} under Standard ${section.standard.StdName} deleted successfully.`,
      Deleted_Section: deletedSection
    });
  })
);

sectionRoute.get(
  "/all-sections",
  TryCatch(async (req, res) => {
    const allSections = await prisma.section.findMany({
      select: {
        id: true,
        SecName: true,
        classTeacher: {
          select: {
            teacher: {
              select: {
                firstname: true, 
                lastname: true,
                username: true,
              },
            },
          },
        },
        standard: {
          select: {
            id: true,
            StdName: true,
          },
        },
      },
    });

    if (allSections.length === 0) {
      return res.status(204).json({
        success: true,
        message: "No sections available yet. Add some.",
        data: [],
      });
    }
    res.status(200).json({
      success: true,
      message: `Total Sections ${allSections.length}`,
      Section: allSections,
    });
  })
);

export default sectionRoute;
