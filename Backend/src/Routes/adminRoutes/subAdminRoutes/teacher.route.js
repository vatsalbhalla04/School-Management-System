import pkg from "@prisma/client";
import { Router } from "express";
import { TryCatch } from "../../../middleware/error.js";
import hashPassword from "../../../utils/password.js";
import {
  addBulkFacultySchema,
  addFacultySchema,
} from "../../../validators/admin/teacher.validator.js";

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
        OR: [
          { username },
          { email }
        ]
      }
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
    
  })
);  

teacherRoute.delete(
  "/delete-faculty/:id",
  TryCatch(async (req, res, next) => {

  })
);

teacherRoute.get(
  "/faculty/:id",
  TryCatch(async (req, res, next) => {

  })
);

teacherRoute.get(
  "/all-faculties",
  TryCatch(async (req, res, next) => {

  })
);

export default teacherRoute;
