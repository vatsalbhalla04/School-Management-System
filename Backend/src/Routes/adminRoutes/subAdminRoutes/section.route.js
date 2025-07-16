import pkg from "@prisma/client";
import { Router } from "express";
import { TryCatch } from "../../../middleware/error.js";
import ErrorHandler from "../../../utils/utility.js";
import sectionValidation from "../../../validators/admin/section.validator.js";
import { tr } from "zod/v4/locales";

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
    }

    // check if this teacher is already-assigned to any section:
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

    // now create the section (maping the std and assigning the classTeacher for that section too)
    const newSection = await prisma.section.create({
      data: {
        SecName,
        standardId: std.id,
        classTeacherId: classTeacher.id || null,
      },
    });

    res.status(200).json({
      success: true,
      message: `Section ${newSection.SecName} added to Standard ${StdName} whose Assigned Class Teacher is ${classTeacherUsername}`,
    });
  })
);

sectionRoute.put(
  "/update-section-details",
  TryCatch(async (req, res, next) => {

    const result = sectionValidation.safeParse(req.body);
    if (!result.success) {
      return next(new ErrorHandler("Validation Failed", 400));
    }

    const { newSecName, StdName, classTeacherUsername,currentSecName } = result.data;

    if(!currentSecName || !StdName)return next(new ErrorHandler("Current Section and Standard Name are required",400));
    
    // Fetch the standard
    const standard = await prisma.standard.findUnique({
      where: {
        StdName,
      },
    });

    if (!standard) {
      return next(new ErrorHandler("Standard not found", 404));
    }

    // Find the section to update
    const section = await prisma.section.findFirst({
      where: {
        SecName: currentSecName,
        standardId: standard.id,
      },
    });

    if (!section) {
      return next(new ErrorHandler("Section Not Found", 404));
    }

    //Section name checks
    if (newSecName) {
      const trimmedNew = newSecName.trim().toLowerCase();
      const trimmedOld = section.SecName.trim().toLowerCase();

      // Same name as existing → reject
      if (trimmedNew === trimmedOld) {
        return next(
          new ErrorHandler(
            "This Section Name already exists in this standard, write a different section name to update",
            400
          )
        );
      }

      // Name already used in this standard → reject
      const existingSection = await prisma.section.findFirst({
        where: {
          SecName: newSecName,
          standardId: standard.id,
          NOT: { id: section.id },
        },
      });

      if (existingSection) {
        return next(
          new ErrorHandler(
            "This Section Name already exists in this standard.",
            400
          )
        );
      }
    }

    // Class teacher update logic (optional)
    let classTeacherId = undefined;
    if (classTeacherUsername) {
      const teacherUser = await prisma.user.findUnique({
        where: { username: classTeacherUsername },
      });

      if (!teacherUser || teacherUser.role !== "TEACHER") {
        return next(new ErrorHandler("Class Teacher Not Valid", 404));
      }

      const teacher = await prisma.teacher.findUnique({
        where: { teacherId: teacherUser.id },
      });

      if (!teacher) {
        return next(new ErrorHandler("Teacher record not found", 404));
      }

      classTeacherId = teacher.id;
    }

    const updatedSection = await prisma.section.update({
      where: {
        id: section.id,
      },
      data: {
        SecName: newSecName || section.SecName,
        classTeacherId,
      },
      include: {
        classTeacher: {
          select: {
            teacher: {
              select: {
                username: true,
              },
            },
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: newSecName
        ? `Section ${currentSecName} updated successfully to Section ${newSecName}`
        : `Section ${currentSecName} updated successfully`,
      updatedSection,
    });
  })
);

sectionRoute.delete(
  "/delete-section",
  TryCatch(async (req, res, next) => {
    const result = sectionValidation.safeParse(req.body); 
    if(!result.success) return next(new ErrorHandler("Validation Error"))

    const { StdName, SecName } = result.data;

    if (!StdName || !SecName)
      return next(new ErrorHandler("StdName and SecName required", 400));

    // Step 1: Find the standard by name
    const standard = await prisma.standard.findUnique({
      where: { StdName },
    });

    if (!standard)
      return next(new ErrorHandler("Standard not found", 404));

    // Step 2: Find the section by SecName and standardId
    const section = await prisma.section.findFirst({
      where: {
        SecName,
        standardId: standard.id,
      },
    });

    if (!section)
      return next(
        new ErrorHandler(`Section ${SecName} not found in Standard ${StdName}`, 404)
      );

    // Step 3: Delete the section
    await prisma.section.delete({
      where: { id: section.id },
    });

    res.status(200).json({
      success: true,
      message: `Section ${SecName} under Standard ${StdName} deleted successfully.`,
    });
  })
);

sectionRoute.get(
  "/all-sections",
  TryCatch(async (req, res) => {

      const allSections = await prisma.section.findMany({
        select:{
          id: true, 
          SecName :true,
          classTeacher:{
            select:{
              teacher:{
                select:{
                  username : true
                }
              }
            }
          }, 
          standard: {
            select:{
              id: true,
              StdName: true
            }
          }, 
        }
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
        Section: allSections
      })
  })
);

export default sectionRoute;
