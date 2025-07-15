import pkg from "@prisma/client";
import { Router } from "express";
import { TryCatch } from "../../../middleware/error.js";
import hashPassword from "../../../utils/password.js";
import {
  addBulkFacultySchema,
  addFacultySchema,
  updateFacultyDetails,
} from "../../../validators/admin/teacher.validator.js";
import ErrorHandler from "../../../utils/utility.js";

const { PrismaClient } = pkg;
const prisma = new PrismaClient();
const teacherRoute = Router();

teacherRoute.post(
  "/add-faculty",
  TryCatch(async (req, res, next) => {
    const result = addFacultySchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.errors,
      });
    }

    const {
      firstname,
      lastname,
      username,
      phoneNumber,
      gender,
      email,
      secretKey,
      password,
    } = result.data;

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User with given username or email already exists.",
      });
    }

    const hashedPassword = await hashPassword(password);

    const teacherUser = await prisma.user.create({
      data: {
        firstname,
        lastname,
        username,
        email,
        phoneNumber,
        gender,
        secretKey,
        password: hashedPassword,
        role: "TEACHER",
      },
      select: {
        id: true,
        firstname: true,
        lastname: true,
        username: true,
        email: true,
        phoneNumber: true,
      },
    });

    const teacherProfile = await prisma.teacher.create({
      data: {
        teacherId: teacherUser.id,
      },
    });

    res.status(200).json({
      success: true,
      message: "Teacher created successfully.",
      user: teacherUser,
      teacher: teacherProfile,
    });
  })
);

teacherRoute.post(
  "/add-faculty-bulk",
  TryCatch(async (req, res, next) => {
    const result = addBulkFacultySchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.errors,
      });
    }

    const failed = [];

    const usersData = await Promise.all(
      result.data.map(async (teacher) => {
        try {
          const exists = await prisma.user.findFirst({
            where: {
              OR: [
                { username: teacher.username },
                { email: teacher.email },
                { phoneNumber: teacher.phoneNumber },
              ],
            },
          });

          if (exists) {
            failed.push({
              username: teacher.username,
              reason: "Username, Email, Phone Number or  already exists",
            });
            return null;
          }

          const hashedPassword = await hashPassword(teacher.password);

          const createdUser = await prisma.user.create({
            data: {
              ...teacher,
              password: hashedPassword,
              role: "TEACHER",
            },
            select: {
              id: true,
              firstname: true,
              lastname: true,
              username: true,
              email: true,
              phoneNumber: true,
            },
          });

          const createdProfile = await prisma.teacher.create({
            data: {
              teacherId: createdUser.id,
            },
          });

          return {
            user: createdUser,
            teacher: createdProfile,
          };
        } catch (error) {
          failed.push({
            username: teacher.username,
            reason: error.message || "Unknown error while creating teacher",
          });
          return null;
        }
      })
    );

    const created = usersData.filter(Boolean); // remove nulls

    res.status(207).json({
      success: true,
      message: `${created.length} teacher(s) created, ${failed.length} failed.`,
      created,
      failed,
    });
  })
);

teacherRoute.put(
  "/update-faculty/:id",
  TryCatch(async (req, res, next) => {
    const parsed = updateFacultyDetails.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validations Failed",
        errors: parsed.error.errors,
      });
    }

    const teacher = await prisma.teacher.findUnique({
      where: {
        id: req.params.id,
      },
      select: {
        teacherId: true,
      },
    });

    if (!teacher) return next(new ErrorHandler("Teacher Not Found", 404));

    const updateFacultyInfo = await prisma.user.update({
      where: {
        id: teacher.teacherId,
      },
      data: parsed.data,
      select: {
        id: true,
        firstname: true,
        lastname: true,
        username: true,
        email: true,
        phoneNumber: true,
        gender: true,
        role: true,
      },
    });

    res.status(200).json({
      success: true,
      message: "Faculty Details Updated successfully",
      Details: updateFacultyInfo,
    });
  })
);

teacherRoute.delete(
  "/delete-faculty/:id",
  TryCatch(async (req, res, next) => {
    const { id } = req.params;

    // Find the teacher to verify existence
    const teacher = await prisma.teacher.findUnique({
      where: { id },
      include: { teacher: true },
    });

    if (!teacher) return next(new ErrorHandler("Faculty Not Found", 404));

    const removedFaculty = await prisma.user.delete({
      where: { id: teacher.teacherId },
      select: {
        firstname: true,
        lastname: true,
        username: true,
      },
    });

    res.status(200).json({
      success: true,
      message: `Faculty ${removedFaculty.firstname} deleted successfully.`,
    });
  })
);

teacherRoute.delete(
  "/delete-all-faculties",
  TryCatch(async (req, res, next) => {
    // will try to implement pagination afterwards.
    const teachers = await prisma.user.findMany({
      where: { role: "TEACHER" },
    });

    if (teachers.length === 0)
      return next(new ErrorHandler("No teachers found", 404));

    const teacherIds = teachers.map((t) => t.id);

    const deletedTeacher = await prisma.user.deleteMany({
      where: {
        id: {
          in: {
            teacherIds,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: `Deleted ${deletedTeacher.count} teachers deleted`,
      deleted: teachers,
    });
  })
);

teacherRoute.get(
  "/faculty-details/:id",
  TryCatch(async (req, res, next) => {
    const teacher = await prisma.teacher.findUnique({
      where: { id: req.params.id },
      include: { teacher: true },
    });

    if (!teacher) return next(new ErrorHandler("Faculty Not Found", 404));

    const getTeacherInfo = await prisma.user.findUnique({
      where: { id: teacher.teacherId },
      select: {
        id: true,
        firstname: true,
        lastname: true,
        username: true,
        email: true,
        phoneNumber: true,
        gender: true,
        role: true,
        createdAt: true,
      },
    });

    res.status(200).json({
      success: true,
      message: `Fetched ${getTeacherInfo.firstname} ${getTeacherInfo.lastname} Deatils Successfully`,
      Faculty_Details: getTeacherInfo,
    });
  })
);

teacherRoute.get(
  "/all-faculties",
  TryCatch(async (req, res, next) => {
    const teachers = await prisma.user.findMany({
      where: { role: "TEACHER" },
    });

    if (teachers.length === 0)
      return next(new ErrorHandler("No teachers Found", 404));

    const teacherIds = teachers.map((t) => t.id);

    const allFaultyDetails = await prisma.user.findMany({
      where: {
        id: {
          in: teacherIds,
        },
      },
      select: {
        firstname: true,
        lastname: true,
        username: true,
        email: true,
        phoneNumber: true,
      },
    });

    res.status(200).json({
      success: true,
      Faculty_Details: allFaultyDetails,
    });
  })
);

export default teacherRoute;
