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
import {
  AddStu,
  UpdateStudent,
} from "../../../validators/admin/student.validator.js";

const studentRoute = Router();

const { PrismaClient } = pkg;

const prisma = new PrismaClient();

studentRoute.post(
  "/addStudent",
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
        message: "Username already exists.",
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

    res.status(200).json({
      success: true,
      message: `Sucessfully Upated the Details of Student ${updateStu.firstname} ${updateStu.lastname}`,
      Updated_Student_Detatils: updateStu,
    });
  })
);

// to delete a student from both the user's table record and sections's table.
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

    res.status(200).json({
      success: true,
      message: `Deleted Student ${findStu.firstname} ${findStu.lastname}`,
    });
  })
);

studentRoute.get(
  "/all-students",
  routeCache(80),
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
        firstname: true,
        lastname: true,
        phoneNumber: true,
        emergencyPhone: true,
        student: {
          select: {
            section: {
              select: {
                SecName: true,
                classTeacher:{
                    select:{
                      teacher:{
                        select:{
                          firstname: true,
                          lastname: true,
                        }
                      }
                    }
                },
                standard: {
                  select: {
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
  routeCache(80),
  TryCatch(async (req, res, next) => {
    const userId = Number(req.query.userId);

    const findUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!findUser) return next(new ErrorHandler("No Student Found", 404));

    const stuDetails = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        ...StuSelectFields,
        student: {
          select: {
            section: {
              select: {
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
                    StdName: true,
                    subjects: {
                      select: {
                        name: true,
                        teacher: {
                         select:{
                          teacher:{
                            select: {
                              id: true,
                              firstname: true,
                              lastname: true,
                              email: true,
                              qualification: true,
                              experience: true,
                              phoneNumber: true,
                            },
                          }
                         }
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
