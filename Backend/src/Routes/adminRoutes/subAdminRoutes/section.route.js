import pkg from "@prisma/client";
import { Router } from "express";
import { ADMIN_BASE_ROUTE, SECTION_CACHE_KEYS } from "../../../constants/admin/cacheKeys.js";
import { TryCatch } from "../../../middleware/error.js";
import routeCache from "../../../middleware/routeCache.js";
import clearCache from "../../../utils/cacheUtils.js";
import ErrorHandler from "../../../utils/utility.js";
import {
  sectionValidation,
  updateSecValidations,
} from "../../../validators/admin/section.validator.js";

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

    clearCache(ADMIN_BASE_ROUTE,SECTION_CACHE_KEYS.SECTION_CACHE);
    clearCache(ADMIN_BASE_ROUTE,SECTION_CACHE_KEYS.ALL_SECTION_CACHE);
    clearCache(ADMIN_BASE_ROUTE,SECTION_CACHE_KEYS.SEC_DROP_DOWN);

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
  "/update-section-details",
  TryCatch(async (req, res, next) => {
    const id = Number(req.query.id);

    const result = updateSecValidations.safeParse(req.body);

    if (!result.success)
      return next(new ErrorHandler("Validations Failed", 404));


    const { newSecName, newStdName, newClassTeacherUserName } = result.data;

    //find the section Id :
    const section = await prisma.section.findUnique({
      where: { id },
    });

    if (!section) return next(new ErrorHandler("No section found", 404));

    let std = null;
    let targetStdId = section.standardId;
    if (newStdName) {
      std = await prisma.standard.findUnique({
        where: {
          StdName: newStdName,
        },
      });
      if (!std) return next(new ErrorHandler("No Standard Found", 404));

      targetStdId = std.id;
    }

    // class Teacher:
    let classTeacher = undefined;
    if (newClassTeacherUserName) {
      const teacher = await prisma.user.findUnique({
        where: {
          username: newClassTeacherUserName,
        },
      });
      if (!teacher || teacher.role != "TEACHER")
        return next(new ErrorHandler("Class Teacher Not Valid", 404));

      const faculty = await prisma.teacher.findUnique({
        where: {
          teacherId: teacher.id,
        },
      });

      if (!faculty) return next(new ErrorHandler("Teacher Not Found", 404));

      classTeacher = faculty.id;

      const existingSecWithTeacher = await prisma.section.findFirst({
        where: {
          standardId: targetStdId,
          classTeacher: {
            id: classTeacher,
          },
          NOT: { id },
        },
      });

      if (existingSecWithTeacher) {
        return next(
          new ErrorHandler(
            `This teacher is already assigned to section '${existingSecWithTeacher.SecName}' of this standard.`,
            400
          )
        );
      }
    }

    const updateSection = await prisma.section.update({
      where: {
        id,
      },
      data: {
        SecName: newSecName ?? undefined, // only update if provided
        classTeacher: classTeacher
          ? { connect: { id: classTeacher } }
          : undefined,
        standard: std ? { connect: { id: std.id } } : undefined,
      },
      include: {
        classTeacher: {
          select: {
            teacher: {
              select: {
                id: true,
                username: true,
                firstname: true,
                lastname: true,
              },
            },
          },
        },
      },
    });

    clearCache(ADMIN_BASE_ROUTE,SECTION_CACHE_KEYS.SECTION_CACHE,{id});
    clearCache(ADMIN_BASE_ROUTE,SECTION_CACHE_KEYS.ALL_SECTION_CACHE,{id});
    clearCache(ADMIN_BASE_ROUTE,SECTION_CACHE_KEYS.SEC_DROP_DOWN,{id});

    res.status(200).json({
      success: true,
      Updated_Section_Details: updateSection,
    });
  })
);

sectionRoute.delete(
  "/delete-section",
  TryCatch(async (req, res, next) => {
    const id = Number(req.query.id);

    // Step 1: Find the standard by name
    const section = await prisma.section.findUnique({
      where: { id },
      include: {
        standard: true,
        students: true, // includes the full User object

        //include is also used in read operations, but instead of cherry-picking fields like select, it fetches the full related model(s).
      },
    });

    if (!section) return next(new ErrorHandler(`Section Not Found`, 404));

    //prevent delete if students are enrolled:
    if (section.students.length > 0)
      return next(
        new ErrorHandler(
          `Cannot delete section ${section.SecName} of standard ${section.standard.StdName} as it has ${section.students.length} enrolled in it`,
          404
        )
      );

    const deletedSection = await prisma.section.delete({
      where: { id },
      select: {
        SecName: true,
        standard: true,
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

    clearCache(ADMIN_BASE_ROUTE,SECTION_CACHE_KEYS.SECTION_CACHE,{id});
    clearCache(ADMIN_BASE_ROUTE,SECTION_CACHE_KEYS.ALL_SECTION_CACHE,{id});
    clearCache(ADMIN_BASE_ROUTE,SECTION_CACHE_KEYS.SEC_DROP_DOWN,{id});

    res.status(200).json({
      success: true,
      message: `Section ${section.SecName} under Standard ${section.standard.StdName} deleted successfully.`,
      Deleted_Section: deletedSection,
    });
  })
);

sectionRoute.get(
  "/section-detail",
  routeCache(160),
  TryCatch(async (req, res, next) => {
    const id = Number(req.query.id);

    const section = await prisma.section.findUnique({
      where: {
        id,
      },
    });

    if (!section) return next(new ErrorHandler("No Section Found", 404));

    const getDetails = await prisma.section.findUnique({
      where: { id },
      select: {
        id: true,
        SecName: true,
        standard: {
          select: {
            StdName: true,
            subjects: {
              select: {
                name: true,
                teacher: {
                  select: {
                    teacher: {
                      select: {
                        firstname: true,
                        lastname: true,
                        username: true,
                        qualification: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        students: {
          select: {
            student: {
              select: {
                id: true,
                firstname: true,
                lastname: true,
                username: true,
                phoneNumber: true,
              },
            },
          },
        },
        classTeacher: {
          select: {
            teacher: {
              select: {
                id: true,
                username: true,
                firstname: true,
                lastname: true,
                qualification: true,
                phoneNumber: true,
              },
            },
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: `Section ${getDetails.SecName} (Std ${getDetails.standard.StdName}) —> Class Teacher: ${getDetails.classTeacher.teacher.firstname} ${getDetails.classTeacher.teacher.lastname}, Total Students: ${getDetails.students.length} and Total Subject: ${getDetails.standard.subjects.length}`,
      Section_Details: getDetails,
    });
  })
);

sectionRoute.get(
  "/DropDownSection",
  routeCache(),
  TryCatch(async (req, res, next) => {
    const sec = await prisma.section.findMany({
      select :{
        id : true,
        SecName : true,
        standard:{
          select:{
            id : true,
          }
        }
      }
    }); 
    res.status(200).json({
      Section : sec
    })
  })
);

sectionRoute.get(
  "/all-sections",
  routeCache(160),
  TryCatch(async (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;

    const totalSec = await prisma.section.count({});

    const allSections = await prisma.section.findMany({
      skip,
      take: limit,
      select: {
        SecName: true,
        _count: {
          select: {
            students: true,
          },
        },
        standard: {
          select: {
            StdName: true,
          },
        },
        classTeacher: {
          select: {
            teacher: {
              select: {
                id: true,
                firstname: true,
                lastname: true,
                username: true,
                qualification: true,
              },
            },
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
      message: `Total Sections ${totalSec}`,
      currentPage: page,
      totalPage: Math.ceil(totalSec / limit),
      Section: allSections,
    });
  })
);

export default sectionRoute;
