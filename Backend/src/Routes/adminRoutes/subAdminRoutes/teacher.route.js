import { Router } from "express";
import { TryCatch } from "../../../middleware/error.js";
import hashPassword from "../../../utils/password.js";
import {
  addBulkFacultySchema,
  addFacultySchema,
  updateTeacherSchema,
} from "../../../validators/admin/teacher.validator.js";
import ErrorHandler from "../../../utils/utility.js";

import pkg from "@prisma/client";
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
  "/update-faculty",
  TryCatch(async (req, res, next) => {
    const result = updateTeacherSchema.safeParse(req.body);

    if (!result.success)
      return next(new ErrorHandler("Validations Failed", 404));

    const {
      currentUsername,
      newFirstname,
      newLastname,
      newEmail,
      newUsername,
      newPhoneNumber,
    } = result.data;

    if (!currentUsername)
      return next(new ErrorHandler("Current Username is required", 400));

    // Step 1: Find existing faculty
    const existingTeacher = await prisma.user.findUnique({
      where: {
        username: currentUsername,
      },
    });

    if (!existingTeacher)
      return next(new ErrorHandler("Faculty not found", 404));

    // Step 2: Check for duplicate newUsername (if it's changing)
    if (newUsername && newUsername !== currentUsername) {
      const usernameExists = await prisma.user.findUnique({
        where: { username: newUsername },
      });

      if (usernameExists)
        return next(new ErrorHandler("New Username already taken", 409));
    }

    // Step 3: Perform update
    const updatedFaculty = await prisma.user.update({
      where: {
        id: existingTeacher.id,
      },
      data: {
        username: newUsername || undefined,
        email: newEmail || undefined,
        firstname: newFirstname || undefined,
        lastname: newLastname || undefined,
        phoneNumber: newPhoneNumber || undefined,
      },
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
      message: "Faculty details updated successfully",
      Details: updatedFaculty,
    });
  })
);

teacherRoute.delete(
  "/delete-faculty",
  TryCatch(async (req, res, next) => {
    const { username } = req.body;

    if (!username) {
      return next(new ErrorHandler("Username is required", 400));
    }

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return next(new ErrorHandler("No user found with this username", 404));
    }

    if (user.role !== "TEACHER") {
      return next(new ErrorHandler("User is not a faculty member", 403));
    }

    // Step 4: Delete user (Teacher row will be cascade-deleted)
    const removedFaculty = await prisma.user.delete({
      where: { id: user.id },
      select: {
        firstname: true,
        lastname: true,
        username: true,
      },
    });

    res.status(200).json({
      success: true,
      message: `Faculty ${removedFaculty.firstname} ${removedFaculty.lastname} deleted successfully.`,
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

teacherRoute.post(
  "/faculty-details",
  TryCatch(async (req, res, next) => {
    const { username } = req.body;

    if (!username) return next(new ErrorHandler("Username is required", 400));

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return next(new ErrorHandler("No user found with this username", 404));

    if (user.role !== "TEACHER") return next(new ErrorHandler("User is not a teacher", 403));

    const facultyDetails = {
      id: user.id,
      firstname: user.firstname,
      lastname: user.lastname,
      username: user.username,
      email: user.email,
      phoneNumber: user.phoneNumber,
      gender: user.gender,
      role: user.role,
      createdAt: user.createdAt,
    };

    res.status(200).json({
      success: true,
      message: `Fetched ${user.firstname} ${user.lastname} details successfully.`,
      Faculty_Details: facultyDetails,
    });
  })
);

teacherRoute.get(
  "/all-faculties",
  TryCatch(async (req, res, next) => {
    const teachers = await prisma.user.findMany({
      where: { role: "TEACHER" },
    });

    if (teachers.length === 0){
      return res.status(204).json({
        success: true,
        message: "No Faculties available yet. Add some.",
        data: [],
      });
    }
    
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
