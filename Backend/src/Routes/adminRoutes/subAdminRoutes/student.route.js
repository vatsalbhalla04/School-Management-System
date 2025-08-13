import pkg from "@prisma/client";
import { Router } from "express";
import {
  StuFields,
  StuSelectFields,
} from "../../../constants/admin/student.prisma.js";
import { TryCatch } from "../../../middleware/error.js";
import routeCache from "../../../middleware/routeCache.js";
import hashPassword from "../../../utils/password.js";
import ErrorHandler from "../../../utils/utility.js";
import clearCache from "../../../utils/cacheUtils.js";
import {
  AddStu,
  UpdateStudent,
} from "../../../validators/admin/student.validator.js";
import {
  ADMIN_BASE_ROUTE,
  STUDENT_CACHE_KEYS,
} from "../../../constants/admin/cacheKeys.js";

const studentRoute = Router();

const { PrismaClient } = pkg;

const prisma = new PrismaClient();

// To Add A student while creating it , from the drop-down menu of Std(optional) and Section(optional):
studentRoute.post(
  "/add-Stu-DropDownMenu",
  TryCatch(async (req, res, next) => {
    const result = AddStu.safeParse(req.body);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        errors: result.error.issues,
      });
    }

    const formData = Object.fromEntries(
      StuFields.map((s) => [s, result.data[s]])
    );

    const { username, password, StdName, SecName, ...rest } = formData;

    const existingUser = await prisma.user.findUnique({ where: { username } });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User Already Exists",
      });
    }

    const hashedPassword = await hashPassword(password);

    let section;

    if (StdName && SecName) {
      section = await prisma.section.findFirst({
        where: {
          SecName,
          standard: {
            StdName,
          },
        },
        select: {
          id: true,
          SecName: true,
          standard: {
            select: { StdName: true },
          },
        },
      });

      if (!section)
        return next(
          new ErrorHandler(
            `No section found for Std: ${StdName} and SecName : ${SecName}`,
            404
          )
        );
    }

    // Now create the user:
    const createdUser = await prisma.user.create({
      data: {
        ...rest,
        username,
        password: hashedPassword,
        role: "STUDENT",
      },
    });

    // create the Student record :
    try {
      const stuRecord = await prisma.student.create({
        data: {
          studentId: createdUser.id,
          ...(section && {
            sectionId: section.id,
          }), // only if the section exists
        },
        select: {
          student: {
            select: {
              id: true,
              firstname: true,
              lastname: true,
              username: true,
            },
          },
          section: {
            select: {
              id: true,
              SecName: true,
              standard: {
                select: {
                  id: true,
                  StdName: true,
                },
              },
            },
          },
        },
      });

      const response = {
        success: true,
        message: `Student ${stuRecord.student.firstname} ${stuRecord.student.lastname} added`,
        Student: stuRecord,
      };

      if (stuRecord.section) {
        response.message += `and enrolled in ${stuRecord.section.standard.StdName}-${stuRecord.section.SecName}`;
      }

      res.status(200).json(response);

      clearCache(ADMIN_BASE_ROUTE, STUDENT_CACHE_KEYS.STUDENT_CACHE);
      clearCache(ADMIN_BASE_ROUTE, STUDENT_CACHE_KEYS.ALL_STUDENT_CACHE);
    } catch (error) {
      if (error.code === "P2002") {
        return res.status(409).json({
          success: true,
          message: "Student already enrolled in this section",
        });
      }
    }
  })
);

// Add A Student , directly in the Section with the Help of sectionId --> req.query.sectionId
studentRoute.post(
  "/add-Student",
  TryCatch(async (req, res, next) => {
    const sectionId = Number(req.query.sectionId);

    if (!sectionId) {
      return res.status(400).json({
        success: false,
        message: "Section id is required in query.",
      });
    }

    const result = AddStu.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.issues,
      });
    }

    const formData = Object.fromEntries(
      StuFields.map((s) => [s, result.data[s]])
    );

    const { username, password, ...rest } = formData;

    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists.",
      });
    }

    const hashedPassword = await hashPassword(password);

    // 1) create user
    const createdUser = await prisma.user.create({
      data: {
        ...rest,
        username,
        password: hashedPassword,
        role: "STUDENT",
      },
    });

    try {
      // 2) auto-bind using secId from query
      const final = await prisma.student.create({
        data: {
          studentId: createdUser.id,
          sectionId: sectionId,
        },
        select: {
          sectionId: true,
          section: {
            select: {
              SecName: true,
              standard: {
                select: {
                  StdName: true,
                },
              },
            },
          },
          student: {
            select: StuSelectFields,
          },
        },
      });

      clearCache(ADMIN_BASE_ROUTE, STUDENT_CACHE_KEYS.STUDENT_CACHE, {sectionId});
      clearCache(ADMIN_BASE_ROUTE, STUDENT_CACHE_KEYS.ALL_STUDENT_CACHE, {sectionId});

      return res.status(201).json({
        success: true,
        message: `Student ${final.student.firstname} ${final.student.lastname} added successfully & enrolled in standard ${final.section.standard.StdName}-${final.section.SecName}`,
        data: final,
      });
    } catch (err) {
      // 3) handle already-enrolled error
      if (err.code === "P2002") {
        // Prisma unique constraint violation
        return res.status(409).json({
          success: false,
          message: "Student is already enrolled in this section!",
        });
      }
      return next(err);
    }
  })
);

// Map/Add a Student in the section , after it is created with help of userId & sectionId.
studentRoute.put(
  "/map-student-with-Section",
  TryCatch(async (req, res, next) => {
    const sectionId = Number(req.query.sectionId);
    const userId = Number(req.query.userId);

    const findStu = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!findStu) return next(new ErrorHandler("No Student Found", 404));

    if (!sectionId) {
      return res.status(400).json({
        success: false,
        message: "Section id is required in query.",
      });
    }

    const student = await prisma.student.findUnique({
      where: { studentId: userId },
    });

    const mapStuWithSection = await prisma.section.update({
      where: {
        id: sectionId,
      },
      data: {
        students: {
          connect: {
            id: student.id,
          },
        },
      },
      select: {
        id: true,
        students: {
          select: {
            student: {
              select: {
                id: true,
                firstname: true,
                lastname: true,
                username: true,
              },
            },
          },
        },
        SecName: true,
        standard: {
          select: {
            id: true,
            StdName: true,
          },
        },
      },
    });

    clearCache(ADMIN_BASE_ROUTE, STUDENT_CACHE_KEYS.STUDENT_CACHE, {sectionId,userId});

    clearCache(ADMIN_BASE_ROUTE, STUDENT_CACHE_KEYS.ALL_STUDENT_CACHE, {sectionId, userId});

    res.status(200).json({
      success: true,
      message: `Student ${findStu.firstname} ${findStu.lastname} Added in ${mapStuWithSection.standard.StdName}-${mapStuWithSection.SecName}`,
      mapStuWithSection,
    });
  })
);

studentRoute.put(
  "/updateStudent",
  TryCatch(async (req, res, next) => {
    const userId = Number(req.query.userId);

    const result = UpdateStudent.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.issues,
      });
    }

    const {
      firstname,
      lastname,
      city,
      country,
      emergencyName,
      emergencyPhone,
      emergencyRelation,
      gender,
      joiningDate,
      phoneNumber,
      state,
      username,
      street,
      zipCode,
    } = result.data;

    const findStu = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!findStu) return next(new ErrorHandler("No Student Found", 404));

    const updateStu = await prisma.user.update({
      where: { id: userId },
      data: {
        firstname,
        lastname,
        username,
        city,
        country,
        emergencyName,
        emergencyPhone,
        emergencyRelation,
        gender,
        joiningDate,
        phoneNumber,
        state,
        street,
        zipCode,
      },
      select: StuSelectFields,
    });

    clearCache(ADMIN_BASE_ROUTE, STUDENT_CACHE_KEYS.STUDENT_CACHE, {userId});

    clearCache(ADMIN_BASE_ROUTE, STUDENT_CACHE_KEYS.ALL_STUDENT_CACHE, {userId});

    res.status(200).json({
      success: true,
      message: `Sucessfully Upated the Details of Student ${updateStu.firstname} ${updateStu.lastname}`,
      Updated_Student_Detatils: updateStu,
    });
  })
);

studentRoute.delete(
  "/delete-student",
  TryCatch(async (req, res, next) => {
    const userId = Number(req.query.userId);

    const findStu = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!findStu) return next(new ErrorHandler("No Student Found", 404));

    //Delete Student + User in a single transaction
    await prisma.$transaction([
      prisma.student.delete({ where: { studentId: userId } }),
      prisma.user.delete({ where: { id: userId } }),
    ]);

    clearCache(ADMIN_BASE_ROUTE, STUDENT_CACHE_KEYS.STUDENT_CACHE, {userId});

    clearCache(ADMIN_BASE_ROUTE, STUDENT_CACHE_KEYS.ALL_STUDENT_CACHE, {userId});

    res.status(200).json({
      success: true,
      message: `Deleted Student ${findStu.firstname} ${findStu.lastname}`,
    });
  })
);

studentRoute.delete(
  "/remove-a-student-from-section",
  TryCatch(async (req, res, next) => {
    const userId = Number(req.query.userId);

    const findStu = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!findStu) return next(new ErrorHandler("Student Not Found", 404));

    const removeStu = await prisma.student.update({
      where: {
        studentId: userId,
      },
      data: {
        sectionId: null,
      },
    });

    clearCache(ADMIN_BASE_ROUTE, STUDENT_CACHE_KEYS.STUDENT_CACHE, {userId});

    clearCache(ADMIN_BASE_ROUTE, STUDENT_CACHE_KEYS.ALL_STUDENT_CACHE, {userId});

    res.status(200).json({
      success: true,
      message: `Student ${findStu.firstname} ${findStu.lastname} removed from Section`,
      removeStu,
    });
  })
);

studentRoute.delete(
  "/remove-all-students-from-section",
  TryCatch(async (req, res, next) => {
    const sectionId = Number(req.query.sectionId);

    const section = await prisma.section.findUnique({
      where: {
        id: sectionId,
      },
      select: {
        SecName: true,
        standard: {
          select: {
            StdName: true,
          },
        },
      },
    });

    if (!section) return next(new ErrorHandler("Section Not Found", 404));

    const removeAllStu = await prisma.student.updateMany({
      where: {
        sectionId: sectionId,
      },
      data: {
        sectionId: null,
      },
    });

    clearCache(ADMIN_BASE_ROUTE, STUDENT_CACHE_KEYS.STUDENT_CACHE, {sectionId});

    clearCache(ADMIN_BASE_ROUTE, STUDENT_CACHE_KEYS.ALL_STUDENT_CACHE, {sectionId});

    res.status(200).json({
      success: true,
      message: `Total ${removeAllStu.count} stundets have been removed from ${section.standard.StdName}-${section.SecName}`,
    });
  })
);

studentRoute.get(
  "/all-students",
  routeCache(30),
  TryCatch(async (req, res, next) => {
    const page = Number(req.query.page) || 1;
    const limit = 7;
    const skip = (page - 1) * limit;

    const stuCount = await prisma.student.count({});

    const allStu = await prisma.user.findMany({
      skip,
      take: limit,
      where: { role: "STUDENT" },
      select: {
        id: true,
        firstname: true,
        lastname: true,
        phoneNumber: true,
        emergencyPhone: true,
        student: {
          select: {
            section: {
              select: {
                id: true,
                SecName: true,
                classTeacher: {
                  select: {
                    teacher: {
                      select: {
                        id: true,
                        firstname: true,
                        lastname: true,
                      },
                    },
                  },
                },
                standard: {
                  select: {
                    id: true,
                    StdName: true,
                    subjects: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: `Total Students Are ${stuCount}`,
      currentPage: page,
      totalPages: Math.ceil(stuCount / limit),
      All_Students: allStu,
    });
  })
);

studentRoute.get(
  "/student-details",
  routeCache(30),
  TryCatch(async (req, res, next) => {
    const userId = Number(req.query.userId);

    // const findUser = await prisma.user.findUnique({
    //   where: { id: userId },
    // });

    // if (!findUser) return next(new ErrorHandler("No Student Found", 404));

    const stuDetails = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        ...StuSelectFields,
        student: {
          select: {
            section: {
              select: {
                id: true,
                SecName: true,
                classTeacher: {
                  select: {
                    teacher: {
                      select: {
                        id: true,
                        firstname: true,
                        lastname: true,
                        email: true,
                        qualification: true,
                        experience: true,
                        phoneNumber: true,
                      },
                    },
                  },
                },
                standard: {
                  select: {
                    id: true,
                    StdName: true,
                    subjects: {
                      select: {
                        name: true,
                        teacher: {
                          select: {
                            teacher: {
                              select: {
                                id: true,
                                firstname: true,
                                lastname: true,
                                email: true,
                                qualification: true,
                                experience: true,
                                phoneNumber: true,
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    res.status(200).json({
      success: true,
      message: `Fetched the Details for Student ${stuDetails.firstname} ${stuDetails.lastname}`,
      Student_Details: stuDetails,
    });
  })
);

export default studentRoute;
